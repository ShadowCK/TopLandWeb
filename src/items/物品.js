import _ from 'lodash';
import { ItemType } from '../enums.js';

class 物品 {
  type = ItemType.物品; // ItemConfig里用于创建物品的，其实实例化后用不着

  name = '玻璃瓶';

  description = '一个玻璃瓶。';

  stackable = true;

  stack = 1;

  maxStack = 10;

  config = null;

  constructor(itemConfig, stackOverride = null) {
    this.config = itemConfig;
    Object.assign(this, this.config);
    if (stackOverride) {
      this.stack = stackOverride;
      this.config.stack = stackOverride;
    }
  }
}

export default 物品;
