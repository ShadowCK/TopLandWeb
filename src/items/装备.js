import _ from 'lodash';
import 物品 from './物品.js';
import { EquipSlot, ItemType } from '../enums.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import { getPlayer } from '../player/玩家管理器.js';

class 装备 extends 物品 {
  // 改写继承自物品类的属性
  type = ItemType.装备; // ItemConfig里用于创建物品的，其实实例化后用不着

  stackable = false;

  maxStack = 1;

  // 装备自身的属性
  requirements = { level: 1, expertiseLevel: 0 };

  slot = EquipSlot.胸甲;

  stats = {};

  constructor(config) {
    super(_.omit(config, 'stats', 'slot', 'requirements'));
    this.config = config;
    // 避免修改config原始数据
    Object.assign(
      this,
      JSON.parse(
        JSON.stringify({
          stats: config.stats,
          slot: config.slot,
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
    if (!entity.装备[this.slot]) {
      entity.装备[this.slot] = [];
    }
    const typeEquipments = entity.装备[this.slot];
    // 如果实体已经装备了这个装备，就不再装备
    if (entity.拥有装备(this)) {
      return;
    }
    const 装备槽数量 = entity.职业.装备槽[this.slot] || 0;
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
    const typeEquipments = entity.装备[this.slot];
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
