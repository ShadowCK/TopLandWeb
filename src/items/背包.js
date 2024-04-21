import _ from 'lodash';
import { ItemType } from '../enums.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import 物品 from './物品.js';
import 装备 from './装备.js';

class 背包 {
  /** @type {import('./物品.js').default[]} */
  items = [];

  loadSavedItems(items, doClear = true) {
    if (doClear) {
      this.items.length = 0;
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
    const prevLength = this.items.length;
    if (!item.stackable) {
      _.times(count, this.items.push(new item.constructor(item.config)));
      generalEvents.emit(EventType.获得物品, {
        config: item.config,
        stack: count,
        startIndex: this.items.length - count,
        endIndex: this.items.length - 1,
        prevLength,
      });
      return;
    }
    const existingItem = this.items.find((other) => other.name === item.name);
    const stacksToAdd = item.stack * count;
    let stackLeft = stacksToAdd;
    let index = null;
    if (existingItem) {
      const added = Math.min(stackLeft, existingItem.maxStack - existingItem.stack);
      index = this.items.indexOf(existingItem);
      existingItem.stack += added;
      stackLeft -= added;
      if (stackLeft === 0) {
        generalEvents.emit(EventType.获得物品, {
          config: item.config,
          stack: stacksToAdd,
          index,
          prevLength,
        });
        return;
      }
    }
    const startIndex = this.items.length;
    while (stackLeft > 0) {
      const newItem = new 物品(item.config);
      newItem.stack = Math.min(stackLeft, newItem.maxStack);
      stackLeft -= newItem.stack;
      this.items.push(newItem);
    }
    generalEvents.emit(EventType.获得物品, {
      config: item.config,
      stack: stacksToAdd,
      index,
      startIndex,
      endIndex: this.items.length - 1,
      prevLength,
    });
  }

  removeItemAt(index) {
    const prevLength = this.items.length;
    const item = this.items[index];
    if (!item) {
      console.error('Trying to remove an item that is not in the bag');
      return;
    }
    if (!item.stackable || item.stack === 1) {
      this.items.splice(index, 1);
    } else {
      item.stack -= 1;
    }
    generalEvents.emit(EventType.失去物品, { config: item.config, stack: 1, index, prevLength });
  }

  /**
   * @param {import('./物品.js').default} item
   */
  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index === -1) {
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

  clear() {
    const itemConfigs = this.items.map((item) => item.config);
    this.items.length = 0;
    generalEvents.emit(EventType.失去物品, itemConfigs);
  }
}

export default 背包;
