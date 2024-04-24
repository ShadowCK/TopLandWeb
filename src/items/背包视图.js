import { EventType, generalEvents } from '../events/事件管理器.js';
import 背包类 from './背包.js';

// 不支持filter by stack
// 继承背包是为了复用代码，CRUD里只有setFilter是public的！
class 背包视图 extends 背包类 {
  背包 = null;

  filter = null;

  constructor(背包, filter) {
    super();
    this.背包 = 背包;
    this.setFilter(filter);

    generalEvents.on(EventType.获得物品, this.addItemCallback.bind(this));
    generalEvents.on(EventType.失去物品, this.removeItemCallback.bind(this));
  }

  setFilter(filter) {
    this.filter = filter;
    this.removeAll();
    this.背包.items.forEach((item) => {
      if (filter(item)) {
        this.addItemAt(item, this.items.length);
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
    if (container !== this.背包 || !this.filter(item)) {
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
    if (container !== this.背包 || !this.filter(item)) {
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
}

export default 背包视图;
