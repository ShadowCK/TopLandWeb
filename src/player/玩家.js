import 实体 from '../combat/实体.js';
import 背包 from '../items/背包.js';

class 玩家 extends 实体 {
  /** @type {import('../player/玩家存档.js').default} */
  玩家存档 = null;

  背包 = new 背包();

  金钱 = 0;

  // 目前不需要额外的构造函数
}

export default 玩家;
