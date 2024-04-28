import _ from 'lodash';
import 物品 from './物品.js';
import { EquipRarity, EquipSlot, ItemType } from '../enums.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import { config as gameConfig, 计算合成等级 } from '../settings.js';
import { applyStats } from '../utils.js';

class 装备 extends 物品 {
  // 改写继承自物品类的属性
  type = ItemType.装备; // ItemConfig里用于创建物品的，其实实例化后用不着

  stackable = false;

  maxStack = 1;

  // 装备自身的属性
  requirements = { level: 1, expertiseLevel: 0 };

  slot = EquipSlot.胸甲;

  stats = {};

  品阶 = 0;

  品质 = EquipRarity.普通;

  合成次数 = 0;

  constructor(config) {
    const arr = ['品阶', '品质', '合成次数', 'stats', 'requirements', 'slot'];
    super(_.omit(config, arr));
    this.config = config;
    Object.assign(this, _.pick(config, arr));
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
    // 将装备放到第一个装备槽
    typeEquipments.unshift(this);
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
    // 移除装备（this）
    typeEquipments.splice(index, 1);
    if (换装备) {
      generalEvents.emit(EventType.脱下装备, { entity, equipment: this, updateUI: false });
      return;
    }
    entity.updateStats();
    generalEvents.emit(EventType.脱下装备, { entity, equipment: this });
  }

  /**
   * @param {装备} other
   */
  可以合成(other) {
    if (other.name !== this.name) {
      return false;
    }
    if (!(other instanceof 装备)) {
      return false;
    }
    if (other.品阶 < this.品阶) {
      return false;
    }
    return true;
  }

  /**
   * @param {装备} other
   */
  合成(other) {
    if (!this.可以合成(other)) {
      return false;
    }
    // 品质为合成物品中的最高者
    this.品质 = Math.max(this.品质, other.品质);
    this.合成次数 += other.合成次数 > 0 ? other.合成次数 : 1;
    return true;
  }

  获取合成等级() {
    return 计算合成等级(this.合成次数);
  }

  获取合成增益() {
    return 1 + this.获取合成等级() * gameConfig.合成等级加成;
  }

  获取实际属性() {
    // TODO: 品质...
    // TODO: 品阶...
    const 合成增益 = this.获取合成增益();
    const stats = _.cloneDeep(this.stats);
    applyStats(stats, ({ value, currentPath }) => {
      const _currentPath = currentPath.join('.');
      const 可增益 =
        gameConfig.可增益属性.findIndex((path) => _currentPath.startsWith(path)) !== -1;
      _.set(stats, currentPath, 可增益 ? value * 合成增益 : value);
    });
    return stats;
  }
}

export default 装备;
