import _ from 'lodash';
import { ItemType } from '../enums.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import 物品 from './物品.js';
import 装备 from './装备.js';

class 背包 {
  /** @type {import('./物品.js').default[]} */
  items = [];
  
  // a shortcut only for debugging
  ui = null;

  hasItem(item) {
    return this.items.includes(item);
  }

  loadSavedItems(items, doClear = true) {
    if (doClear) {
      this.removeAll(true);
    }
    items.forEach((itemConfig) => {
      this.addItemFromConfig(itemConfig);
    });
  }
  
  addItemFromConfig(itemConfig, count = 1) {
    if (itemConfig.type === ItemType.装备) {
      this.addItem(new 装备(itemConfig), count);
    } else if (itemConfig.type === ItemType.物品) {
      this.addItem(new 物品(itemConfig), count);
    } else {
      console.error('未知物品类型', itemConfig.type);
    }
  }

  /**
   * @param {物品} item
   */
  addItem(item, count = 1) {
    debugger;
    const prevLength = this.items.length;
    if (!item.stackable) {
      _.times(count, () => {
        const newItem = new item.constructor(item.config);
        const index = this.items.push(newItem) - 1;
        generalEvents.emit(EventType.获得物品, {
          container: this,
          index,
          newItem,
          stack: 1,
          prevLength,
        });
      });
      return;
    }

    const stacksToAdd = item.stack * count;
    let stackLeft = stacksToAdd;
    // 堆叠在已有物品
    for (let i = 0; i < this.items.length; i++) {
      if (stackLeft <= 0) {
        break;
      }
      const existingItem = this.items[i];
      if (existingItem.name === item.name) {
        const added = Math.min(stackLeft, existingItem.maxStack - existingItem.stack);
        existingItem.stack += added;
        stackLeft -= added;
        generalEvents.emit(EventType.获得物品, {
          container: this,
          index: i,
          item: existingItem,
          stack: added,
          prevLength,
        });
      }
    }
    // 作为新物品
    while (stackLeft > 0) {
      const newItem = new item.constructor(item.config);
      newItem.stack = Math.min(stackLeft, newItem.maxStack);
      stackLeft -= newItem.stack;
      this.items.push(newItem);
      generalEvents.emit(EventType.获得物品, {
        container: this,
        index: this.items.length - 1,
        item: newItem,
        stack: newItem.stack,
        prevLength,
      });
    }
  }

  removeItemAt(index) {
    const prevLength = this.items.length;
    const item = this.items[index];
    if (!item) {
      console.error('Trying to remove an item that is not in the bag');
      return;
    }
    this.items.splice(index, 1);
    generalEvents.emit(EventType.失去物品, { container: this, index, item, prevLength });
  }

  /**
   * @param {import('./物品.js').default} item
   */
  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index === -1) {
      debugger;
      console.error('Trying to remove an item that is not in the bag');
      return;
    }
    this.removeItemAt(index);
  }

  removeByName(itemName) {
    const index = this.items.findIndex((other) => other.name === itemName);
    if (index === -1) {
      console.error('Trying to remove an item that is not in the bag');
      return;
    }
    this.removeItemAt(index);
  }

  removeAll(emitEvent) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items.pop();
      if (emitEvent) {
        generalEvents.emit(EventType.失去物品, { container: this, index:i, item, prevLength: i });
      }
    }
  }
}

export default 背包;
