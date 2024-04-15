import 实体 from '../combat/实体.js';

class 玩家 extends 实体 {
  /** @type {import('../player/玩家存档.js').default} */
  玩家存档 = null;

  constructor(params) {
    super();

    // 应用职业属性

    // 更新玩家的属性
  }

  updateStats() {
    super.updateStats();
    // TODO: 装备的属性加成
    // 也可以用processStats函数处理
  }
}

export default 玩家;
