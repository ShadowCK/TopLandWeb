import 实体 from '../combat/实体.js';

class 玩家 extends 实体 {
  /** @type {import('../player/玩家存档.js').default} */
  玩家存档 = null;
  
  // 目前不需要额外的构造函数

  updateStats() {
    super.updateStats();
    // TODO: 装备的属性加成
    // 装备加成也可以用processStats函数处理
  }
}

export default 玩家;
