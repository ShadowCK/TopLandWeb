import _ from 'lodash';
import { ItemType } from '../enums.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import 物品 from './物品.js';
import 装备 from './装备.js';
import { 装备存档数据 } from '../player/玩家存档.js';

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
    const config = _.cloneDeep(item.config);
    if (item instanceof 装备) {
      _.merge(config, _.pick(item, 装备存档数据));
    }
    const prevLength = this.items.length;
    const addOne = () => {
      if (!item.stackable) {
        const newItem = new item.constructor(config);
        const index = this.items.push(newItem) - 1;
        generalEvents.emit(EventType.获得物品, {
          container: this,
          index,
          item: newItem,
          stack: 1,
          prevLength,
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
        const newItem = new item.constructor(config);
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
    };
    _.times(count, () => addOne());
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
        generalEvents.emit(EventType.失去物品, { container: this, index: i, item, prevLength: i });
      }
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
