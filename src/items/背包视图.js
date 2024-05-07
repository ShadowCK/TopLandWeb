import { EventType, HTMLEvents, generalEvents } from '../events/事件管理器.js';
import 背包类 from './背包.js';

// 不支持filter by stack
// 继承背包是为了复用代码，CRUD里只有setFilter是public的！
class 背包视图 extends 背包类 {
  背包 = null;

  filter = null;

  addItemHandle = this.addItemCallback.bind(this);

  removeItemHandle = this.removeItemCallback.bind(this);

  updateItemHandle = this.updateItemCallback.bind(this);

  constructor(背包, filter) {
    super();
    this.背包 = 背包;
    this.setFilter(filter);

    generalEvents.on(EventType.获得物品, this.addItemHandle);
    generalEvents.on(EventType.失去物品, this.removeItemHandle);
    HTMLEvents.on(EventType.更新背包物品, this.updateItemHandle);
  }

  // 不注销handler的话object永远被EventEmitter引用着，object就gc不掉
  unregisterHandlers() {
    generalEvents.off(EventType.获得物品, this.addItemHandle);
    generalEvents.off(EventType.失去物品, this.removeItemHandle);
    HTMLEvents.off(EventType.更新背包物品, this.updateItemHandle);
  }

  setFilter(filter, emitEvent = false) {
    this.filter = filter;
    this.removeAll(emitEvent);
    this.背包.items.forEach((item) => {
      if (filter(item)) {
        this.items.push(item);
        // this.addItemAt(item, this.items.length);
        if (emitEvent) {
          generalEvents.emit(EventType.获得物品, {
            container: this,
            index: this.items.length - 1,
            item,
            stack: item.stack,
            prevLength: this.items.length - 1,
          });
        }
      }
    });
  }

  computeItemIndexInView(targetItem) {
    let index = -1;
    this.背包.items.some((item) => {
      if (this.filter(item)) {
        index++;
        if (item === targetItem) {
          return true;
        }
      }
      return false;
    });
    return index;
  }

  addItemAt(item, index) {
    if (index < 0 || index > this.items.length) {
      throw Error();
    }
    this.items.splice(index, 0, item);
    generalEvents.emit(EventType.获得物品, {
      container: this,
      index,
      item,
      stack: item.stack,
      prevLength: this.items.length - 1,
    });
  }

  addItemCallback({ container, item, stack, prevLength }) {
    if (this.背包 !== container || !this.filter(item)) {
      return;
    }

    if (prevLength !== this.背包.items.length) {
      const index = this.computeItemIndexInView(item);
      this.addItemAt(item, index);
    } else {
      const index = this.items.indexOf(item);
      generalEvents.emit(EventType.获得物品, {
        container: this,
        index,
        item,
        stack,
        prevLength: this.items.length,
      });
    }
  }

  removeItemCallback({ container, item, prevLength }) {
    if (this.背包 !== container) {
      return;
    }

    if (Array.isArray(item)) {
      const toRemoveItems = item.filter((i) => this.filter(i));
      toRemoveItems.forEach((toRemoveItem) => {
        this.items.splice(this.items.indexOf(toRemoveItem), 1);
      });
      generalEvents.emit(EventType.失去物品, {
        container: this,
        index: -1,
        item: toRemoveItems,
        prevLength: this.items.length + toRemoveItems.length,
      });
      return;
    }

    const index = this.items.indexOf(item);
    if (index === -1) {
      throw new Error();
    }

    if (prevLength !== this.背包.items.length) {
      this.removeItemAt(index);
    } else {
      generalEvents.emit(EventType.失去物品, {
        container: this,
        index,
        item,
        prevLength: this.items.length,
      });
    }
  }

  updateItemCallback({ container, index: inventoryIndex }) {
    if (this.背包 !== container) {
      return;
    }
    const item = this.背包.items[inventoryIndex];
    if (!this.filter(item)) {
      return;
    }
    const index = this.items.indexOf(item);
    if (index === -1) {
      throw new Error();
    }
    generalEvents.emit(EventType.更新背包物品, {
      container: this,
      index,
    });
  }
}

export default 背包视图;
