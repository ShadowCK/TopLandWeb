import 实体 from '../combat/实体.js';
import 背包 from '../items/背包.js';
import { get最高专精等级经验倍率 } from '../settings.js';

class 玩家 extends 实体 {
  /** @type {import('../player/玩家存档.js').default} */
  玩家存档 = null;

  背包 = new 背包();

  金钱 = 0;

  // 目前不需要额外的构造函数

  addExp(exp) {
    super.addExp(exp, get最高专精等级经验倍率(this.职业.expertiseLevel));
  }
}

export default 玩家;
