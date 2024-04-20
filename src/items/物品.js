import { ItemType } from '../enums.js';

class 物品 {
  name = '玻璃瓶';

  description = '一个玻璃瓶。';

  stackable = true;

  type = ItemType.物品;

  stack = 1;

  maxStack = 10;

  config = null;

  constructor(itemConfig, count) {
    this.config = itemConfig;
    Object.assign(this, itemConfig);
    this.stack = count;
  }
}

export default 物品;
