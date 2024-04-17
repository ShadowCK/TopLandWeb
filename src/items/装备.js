import _ from 'lodash';
import 物品 from './物品.js';
import { EquipType } from './装备信息.js';

class 装备 extends 物品 {
  // 改写继承自物品类的属性
  stackable = false;

  maxStack = 1;

  // 装备自身的属性
  requirements = { level: 1, expertiseLevel: 0 };

  type = EquipType.胸甲;

  stats = {};

  constructor(config) {
    super(_.omit(config, 'stats'));
    this.stats = JSON.parse(JSON.stringify(config.stats));
  }

  /**
   * @param {import('../combat/实体.js').default} entity
   */
  穿上(entity, updateStats = true) {
    if (!entity.装备[this.type]) {
      entity.装备[this.type] = [];
    }
    const typeEquipments = entity.装备[this.type];
    const 装备槽数量 = entity.职业.装备槽[this.type] || 0;
    if (typeEquipments.length >= 装备槽数量) {
      // 脱下第一件装备。不用让玩家选择脱哪一件，他们可以手动脱。
      typeEquipments[0].脱下(entity, false);
    }
    typeEquipments.push(this);
    if (!updateStats) {
      return;
    }
    entity.updateStats();
  }

  /**
   * @param {import('../combat/实体.js').default} entity
   */
  脱下(entity, updateStats = true) {
    const typeEquipments = entity.装备[this.type];
    if (!typeEquipments) {
      console.error('Entity has no equipped items of this type');
      return;
    }
    const index = typeEquipments.indexOf(this);
    if (index === -1) {
      console.error('Trying to unequip an item that is not equipped');
      return;
    }
    typeEquipments.splice(index, 1);
    if (!updateStats) {
      return;
    }
    entity.updateStats();
  }
}

export default 装备;
