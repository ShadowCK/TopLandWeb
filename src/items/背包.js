import _ from 'lodash';
import { ItemType } from '../enums.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import 物品 from './物品.js';
import 装备 from './装备.js';
import { 装备存档数据 } from '../player/玩家存档.js';

class 背包 {
  /** @type {物品[]} */
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
      return this.addItem(new 装备(itemConfig), count);
    }
    if (itemConfig.type === ItemType.物品) {
      return this.addItem(new 物品(itemConfig), count);
    }
    console.error('未知物品类型', itemConfig.type);
    return [];
  }

  /**
   * @param {物品} item
   * @param {number} count
   * @param {number} atIndex
   */
  addItem(item, count = 1, atIndex = null) {
    const added = [];
    const config = _.cloneDeep(item.config);
    if (item instanceof 装备) {
      _.merge(config, _.pick(item, 装备存档数据));
    }
    const prevLength = this.items.length;
    if (!item.stackable) {
      let index = atIndex != null && atIndex !== -1 ? atIndex : this.items.length;
      _.times(count, () => {
        const newItem = new item.constructor(config);
        this.items.splice(index, 0, newItem);
        added.push(newItem);
        generalEvents.emit(EventType.获得物品, {
          container: this,
          index,
          item: newItem,
          stack: 1,
          prevLength,
        });
        index += 1;
      });
      return added;
    }

    const stacksToAdd = item.stack * count;
    let stackLeft = stacksToAdd;
    const addToIndex = (index) => {
      let _index = atIndex != null && atIndex !== -1 ? index : this.items.length;
      // TODO：优化性能，不要用while，直接计算出要插入几个元素（N个最大堆叠+1剩余堆叠）并用splice插入
      while (stackLeft > 0) {
        const newItem = new item.constructor(config);
        newItem.stack = Math.min(stackLeft, newItem.maxStack);
        stackLeft -= newItem.stack;
        this.items.splice(_index, 0, newItem);
        added.push(newItem);
        generalEvents.emit(EventType.获得物品, {
          container: this,
          index: _index,
          item: newItem,
          stack: newItem.stack,
          prevLength,
        });
        _index += 1;
      }
    };
    // 堆叠在已有物品
    for (let i = 0; i < this.items.length; i++) {
      if (stackLeft <= 0) {
        break;
      }
      const existingItem = this.items[i];
      if (existingItem.name === item.name) {
        // 堆叠的物品不加到added里，因为不是新物品
        const usedStacks = Math.min(stackLeft, existingItem.maxStack - existingItem.stack);
        existingItem.stack += usedStacks;
        stackLeft -= usedStacks;
        generalEvents.emit(EventType.获得物品, {
          container: this,
          index: i,
          item: existingItem,
          stack: usedStacks,
          prevLength,
        });
      }
    }
    // 放置在指定位置或末尾
    addToIndex(atIndex);
    return added;
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
   * @param {物品} item
   */
  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index === -1) {
      console.error('Trying to remove an item that is not in the bag');
      return;
    }
    this.removeItemAt(index);
  }

  removeItems(items) {
    const prevLength = this.items.length;
    items.forEach((item) => {
      const index = this.items.indexOf(item);
      if (index === -1) {
        console.error('Trying to remove an item that is not in the bag');
        return;
      }
      this.items.splice(index, 1);
    });
    generalEvents.emit(EventType.失去物品, { container: this, index: -1, item: items, prevLength });
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
    const items = Array.from(this.items);
    this.items.length = 0;
    if (emitEvent) {
      generalEvents.emit(EventType.失去物品, {
        container: this,
        item: items,
        prevLength: items.length,
      });
    }
  }

  /**
   * @param {string} name
   * @returns {number}
   */
  countItem(name) {
    return this.items.reduce((acc, item) => (item.name === name ? acc + item.stack : acc), 0);
  }

  /**
   * @param {物品} item
   * @returns {number} index of the item in the inventory, -1 if not found
   */
  findItemIndex(item) {
    return this.items.indexOf(item);
  }

  /**
   * @param {装备} equipment
   * @returns {装备[]}
   */
  获取可合成装备(equipment) {
    const 可合成装备 = this.items.filter((other) => equipment.可以合成(other));
    _.remove(可合成装备, (other) => other === equipment);
    return 可合成装备;
  }
}

export default 背包;
