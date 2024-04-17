import _ from 'lodash';
import 物品 from './物品.js';
import { EquipType } from './装备信息.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import { getPlayer } from '../player/玩家管理器.js';

class 装备 extends 物品 {
  // 改写继承自物品类的属性
  stackable = false;

  maxStack = 1;

  // 装备自身的属性
  requirements = { level: 1, expertiseLevel: 0 };

  type = EquipType.胸甲;

  stats = {};

  constructor(config) {
    super(_.omit(config, 'stats', 'type', 'requirements'));
    Object.assign(
      this,
      JSON.parse(
        JSON.stringify({
          stats: config.stats,
          type: config.type,
          requirements: config.requirements,
        }),
      ),
    );
  }

  // TODO: 穿上和脱下转到实体类中
  /**
   * @param {import('../combat/实体.js').default} entity
   */
  穿上(entity) {
    if (!entity.装备[this.type]) {
      entity.装备[this.type] = [];
    }
    const typeEquipments = entity.装备[this.type];
    // 如果实体已经装备了这个装备，就不再装备
    if (entity.拥有装备(this)) {
      return;
    }
    const 装备槽数量 = entity.职业.装备槽[this.type] || 0;
    if (typeEquipments.length >= 装备槽数量 && 装备槽数量 > 0) {
      // 脱下第一件装备。不用让玩家选择脱哪一件，他们可以手动脱。
      typeEquipments[0].脱下(entity, true);
    }
    if (entity === getPlayer()) {
      entity.背包.removeItem(this);
    }
    typeEquipments.push(this);
    entity.updateStats();
    generalEvents.emit(EventType.穿上装备, { entity, equipment: this });
  }

  /**
   * @param {import('../combat/实体.js').default} entity
   */
  脱下(entity, 换装备 = false) {
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
    const removed = typeEquipments.splice(index, 1)[0];
    if (entity === getPlayer()) {
      entity.背包.addItem(removed);
    }
    if (换装备) {
      return;
    }
    entity.updateStats();
    generalEvents.emit(EventType.脱下装备, { entity, equipment: this });
  }
}

export default 装备;
