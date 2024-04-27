import 实体 from '../combat/实体.js';
import 背包 from '../items/背包.js';
import 装备 from '../items/装备.js';
import { get最高专精等级经验倍率 } from '../settings.js';
import { 退出战斗区域 } from '../combat/战斗管理器.js';

class 玩家 extends 实体 {
  /** @type {import('../player/玩家存档.js').default} */
  玩家存档 = null;

  背包 = new 背包();

  金钱 = 0;

  最高专精等级 = 0;

  /** @type{{[专精名:string]:number}} */
  专精等级 = {};

  // 目前不需要额外的构造函数

  addExp(exp) {
    super.addExp(exp, get最高专精等级经验倍率(this.最高专精等级));
  }

  dropItem(item) {
    const isEquipment = item instanceof 装备;
    if (isEquipment && this.拥有装备(item)) {
      item.脱下(this);
    }
    this.背包.removeItem(item);
  }

  dropItems(items) {
    this.背包.removeItems(items);
  }


  reset() {
    退出战斗区域();
    super.reset();
    // TODO: 添加更多...
  }
}

export default 玩家;
