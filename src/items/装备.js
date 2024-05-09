import _ from 'lodash';
import 物品 from './物品.js';
import { EquipRarity, EquipSlot, ItemType } from '../enums.js';
import { EventType, generalEvents } from '../events/事件管理器.js';
import { config as gameConfig, 计算合成等级, 计算装备品阶属性倍率 } from '../settings.js';
import { applyStats, 属性可增益 } from '../utils.js';
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

  品阶 = 0;

  品质 = EquipRarity.普通;

  合成次数 = 0;

  constructor(config) {
    const arr = ['品阶', '品质', '合成次数', 'stats', 'requirements', 'slot'];
    super(_.omit(config, arr));
    this.config = config;
    Object.assign(this, _.pick(config, arr));
  }

  hasMetRequirements = (entity) => {
    const { level: levelReq, expertiseLevel: expertiseReq } = this.requirements;
    const { level, expertiseLevel } = entity.职业;
    if (levelReq != null && levelReq > level) {
      return false;
    }
    if (expertiseReq != null && expertiseReq > expertiseLevel) {
      return false;
    }
    return true;
  };

  // TODO: 可以穿上，穿上和脱下转到实体类中。或者实体类加一个桥接方法？
  /**
   * @param {实体} entity
   * @param {boolean} canSwap 如果装备槽已满，是否可以脱下一件装备再穿上
   */
  可以穿上(entity, canSwap = true, checkReqs = true) {
    if (!entity.装备[this.slot]) {
      entity.装备[this.slot] = [];
    }
    const 装备槽数量 = entity.职业.获取装备槽数量(this.slot);
    if (装备槽数量 <= 0) {
      return false;
    }
    // 如果实体已经装备了这个装备，就不再装备
    if (entity.拥有装备(this)) {
      return false;
    }
    const hasMetRequirements = checkReqs ? this.hasMetRequirements(entity) : true;
    if (canSwap) {
      return hasMetRequirements;
    }
    return entity.装备槽未满(this.slot) && hasMetRequirements;
  }

  /**
   * 为实体穿上装备。如果装备槽已满，会脱下第一件装备。
   * @param {实体} entity
   */
  穿上(entity, canSwap = true, checkReqs = true) {
    if (!this.可以穿上(entity, canSwap, checkReqs)) {
      return false;
    }
    const typeEquipments = entity.装备[this.slot];
    if (!typeEquipments) {
      throw new Error('不该发生的错误——实体没有存储该类型装备的数组。');
    }
    if (!entity.装备槽未满(this.slot)) {
      // 脱下第一件装备。不需要为玩家提供脱哪一件的选择，玩家可以手动脱。
      const player = getPlayer();
      if (entity === player) {
        const index = player.背包.items.findIndex((item) => item === this);
        typeEquipments[0].脱下(entity, true, index);
      } else {
        typeEquipments[0].脱下(entity, true);
      }
    }
    // 将装备放到第一个装备槽
    typeEquipments.unshift(this);
    entity.updateStats();
    generalEvents.emit(EventType.穿上装备, { entity, equipment: this });
    return true;
  }

  /**
   * @param {实体} entity
   */
  脱下(entity, 换装备 = false, 换装备到 = null) {
    // 有效性检查——是否真的装备了这个装备。
    const typeEquipments = entity.装备[this.slot];
    if (!typeEquipments) {
      console.error('不该发生的错误——实体没有存储该类型装备的数组。');
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
      generalEvents.emit(EventType.脱下装备, {
        entity,
        equipment: this,
        updateUI: false,
        toIndex: 换装备到,
      });
      return;
    }
    entity.updateStats();
    generalEvents.emit(EventType.脱下装备, { entity, equipment: this, toIndex: -1 });
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
    this.合成次数 += other.合成次数 + 1; // 物品本身提供1合成次数
    return true;
  }

  获取品质倍率() {
    return gameConfig.装备属性品质倍率[this.品质];
  }

  获取品阶增益() {
    return 计算装备品阶属性倍率(this.品阶);
  }

  获取合成等级() {
    return 计算合成等级(this.合成次数);
  }

  获取合成增益() {
    return 1 + this.获取合成等级() * gameConfig.合成等级加成;
  }

  获取实际属性() {
    const 品阶倍率 = this.获取品阶增益();
    const 合成增益 = this.获取合成增益();
    const 品质倍率 = this.获取品质倍率();
    const stats = _.cloneDeep(this.stats);
    applyStats(stats, ({ value, currentPath }) => {
      const mult = 属性可增益(value, currentPath) ? 合成增益 * 品阶倍率 * 品质倍率 : 品质倍率;
      _.set(stats, currentPath, value * mult);
    });
    return stats;
  }
}

export default 装备;
