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
    const add = () => {
      if (!item.stackable) {
        this.items.push(item);
        generalEvents.emit(EventType.获得物品, item.config);
        return;
      }
      const existingItem = this.items.find((other) => other.name === item.name);
      let stackLeft = item.stack;
      if (existingItem) {
        const added = Math.min(stackLeft, existingItem.maxStack - existingItem.stack);
        existingItem.stack += added;
        stackLeft -= added;
      }
      while (stackLeft > 0) {
        const newItem = new 物品(item.config);
        newItem.stack = Math.min(stackLeft, newItem.maxStack);
        stackLeft -= newItem.stack;
        this.items.push(newItem);
      }
      generalEvents.emit(EventType.获得物品, item.config);
    };
    for (let i = 0; i < count; i++) {
      add();
    }
  }

  removeItemAt(index) {
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
    generalEvents.emit(EventType.失去物品, item.config);
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
