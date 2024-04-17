import { EventType, generalEvents } from '../events/事件管理器.js';
import 物品 from './物品.js';

class 背包 {
  /** @type {import('./物品.js').default[]} */
  items = [];

  /**
   * @param {import('./物品.js').default} item
   */
  addItem(item) {
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
  }

  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index === -1) {
      console.error('Trying to remove an item that is not in the bag');
      return;
    }
    this.items.splice(index, 1);
    generalEvents.emit(EventType.失去物品, item.config);
  }

  /**
   * @param {import('./物品.js').default} item
   */
  removeByName(itemName) {
    const index = this.items.findIndex((other) => other.name === itemName);
    if (index === -1) {
      console.error('Trying to remove an item that is not in the bag');
      return;
    }
    const item = this.items[index];
    if (!item.stackable) {
      this.items.splice(index, 1);
      generalEvents.emit(EventType.失去物品, item.config);
      return;
    }
    if (item.stack === 1) {
      this.items.splice(index, 1);
      generalEvents.emit(EventType.失去物品, item.config);
      return;
    }
    item.stack -= 1;
    generalEvents.emit(EventType.失去物品, item.config);
  }
}

export default 背包;
