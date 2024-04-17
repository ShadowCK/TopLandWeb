class 物品 {
  name = '玻璃瓶';

  description = '一个玻璃瓶。';

  stackable = true;

  stack = 1;

  maxStack = 64;

  config = null;

  constructor(itemConfig) {
    this.config = itemConfig;
    const copy = JSON.parse(JSON.stringify(itemConfig));
    Object.assign(this, copy);
  }
}

export default 物品;
