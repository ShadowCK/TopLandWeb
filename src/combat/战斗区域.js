import _ from 'lodash';
import 敌人信息 from './敌人信息.js';
import * as settings from '../settings.js';
import 敌人 from './敌人.js';
import { EventType, combatEvents } from '../events/事件管理器.js';
import { sampleWeighted } from '../utils.js';

const configs = {
  训练场: {
    name: '训练场',
    description: '可以测试自己的实力。',
    必刷BOSS刷怪数量: -1,
    enemies: {
      训练木桩: {
        config: 敌人信息.训练木桩,
        weight: 100,
      },
    },
  },
  下水道: {
    name: '下水道',
    description: '下水道里面有很多老鼠，还有一些其他的东西。',
    必刷BOSS刷怪数量: 50,
    enemies: {
      老鼠: {
        config: 敌人信息.老鼠,
        weight: 100,
      },
      幸运鼠: {
        config: 敌人信息.幸运鼠,
        weight: 5,
      },
      老鼠国王: {
        config: 敌人信息.老鼠国王,
        weight: 1,
        isBoss: true,
      },
      老鼠隐者: {
        config: 敌人信息.老鼠隐者,
        weight: 0.1,
      },
    },
  },
  新大陆: {
    name: '新大陆',
    description: '魔能大陆重建前魔能使们停留的地方。昔日的荣光已经不再，只剩下愚蠢的后世文明。',
    必刷BOSS刷怪数量: 25,
    enemies: {
      菜鸡魔能使: {
        config: 敌人信息.菜鸡魔能使,
        weight: 100,
      },
      剑士练习生: {
        config: 敌人信息.剑士练习生,
        weight: 50,
      },
      装逼的骑士: {
        config: 敌人信息.装逼的骑士,
        weight: 2,
        isBoss: true,
      },
    },
  },
  科科猪场: {
    name: '科科猪场',
    description: '新大陆传奇人物李科养育的无性繁殖猪的牧场。他一直不擅长管理猪的数量。',
    必刷BOSS刷怪数量: 25,
    enemies: {
      小猪: {
        config: 敌人信息.小猪,
        weight: 100,
      },
      魔法母猪: {
        config: 敌人信息.魔法母猪,
        weight: 25,
      },
      暴怒野猪王: {
        config: 敌人信息.暴怒野猪王,
        weight: 1,
        isBoss: true,
      },
    },
  },
  蜘蛛洞穴: {
    name: '蜘蛛洞穴',
    description: '新大陆一处被魔物占据的废弃矿坑，有很多神奇的生物。',
    必刷BOSS刷怪数量: 40,
    enemies: {
      蜘蛛宝宝: {
        config: 敌人信息.蜘蛛宝宝,
        weight: 100,
      },
      蜘蛛大兵: {
        config: 敌人信息.蜘蛛大兵,
        weight: 50,
      },
      蜘蛛斥候: {
        config: 敌人信息.蜘蛛斥候,
        weight: 40,
      },
      着魔村民: {
        config: 敌人信息.着魔村民,
        weight: 20,
      },
      只猪: {
        config: 敌人信息.只猪,
        weight: 10,
      },
      只狼: {
        config: 敌人信息.只狼,
        weight: 0.5,
      },
      蜘蛛女皇: {
        config: 敌人信息.蜘蛛女皇,
        weight: 5,
        isBoss: true,
      },
    },
  },
  永霜要塞: {
    name: '永霜要塞',
    description: '昔日寒霜王朝领下的一所要塞，内部已然腐朽。',
    必刷BOSS刷怪数量: 50,
    enemies: {
      霜铠剑士: {
        config: 敌人信息.霜铠剑士,
        weight: 100,
      },
      冰封术士: {
        config: 敌人信息.冰封术士,
        weight: 50,
      },
      雪花傀儡: {
        config: 敌人信息.雪花傀儡,
        weight: 25,
      },
      冰晶傀儡: {
        config: 敌人信息.冰晶傀儡,
        weight: 25,
      },
      要塞领主: {
        config: 敌人信息.要塞领主,
        weight: 2,
        isBoss: true,
      },
    },
  },
  燃烧古堡: {
    name: '燃烧古堡',
    description: '被永恒火焰覆盖的诅咒城堡，弥漫着烧焦的气味。',
    必刷BOSS刷怪数量: 50,
    enemies: {
      尸体: {
        config: 敌人信息.尸体,
        weight: 100,
      },
      岩浆史莱姆: {
        config: 敌人信息.岩浆史莱姆,
        weight: 100,
      },
      熔岩巨兽: {
        config: 敌人信息.熔岩巨兽,
        weight: 15,
      },
      尸体发火: {
        config: 敌人信息.尸体发火,
        weight: 15,
      },
      落魄的大帝: {
        config: 敌人信息.落魄的大帝,
        weight: 2,
        isBoss: true,
      },
    },
  },
};

class 战斗区域 {
  // 配置数据
  name = '下水道';

  description = '下水道里面有很多老鼠。';

  enemies = {
    老鼠: {
      config: 敌人信息.老鼠,
      weight: 1,
    },
  };

  // 可选配置数据，通常情况下默认值就足矣
  最大敌人数 = settings.config.最大敌人数;

  最大队友数 = settings.config.最大队友数;

  刷怪间隔 = settings.config.刷怪间隔;

  无敌人刷怪倍速 = settings.config.无敌人刷怪倍速;

  必刷BOSS刷怪数量 = settings.config.必刷BOSS刷怪数量;

  levelCap = settings.config.最大区域等级上限; // 最大等级的上限，即最大最大等级

  // 非配置数据
  level = 0; // 会被保存

  maxLevel = 0; // 会被保存

  敌人 = [];

  队友 = [];

  刷怪计时器 = 0;

  // 达到一定次数，必定刷新BOSS
  刷怪数量 = 0;

  statMultiplier = 1;

  constructor(config) {
    Object.assign(this, config);
    this.reset();
  }

  reset() {
    this.刷怪数量 = 0;
    this.刷怪计时器 = 0;
    this.clearEnemies();
    this.updateStatMultiplier();
  }

  updateStatMultiplier() {
    this.statMultiplier = settings.计算区域难度属性倍率(this.level);
  }

  /**
   * 无敌人时刷怪速度加快
   * @returns {number} 刷怪倍速
   */
  get刷怪倍速() {
    return this.敌人.length === 0 ? this.无敌人刷怪倍速 : 1;
  }

  update(dt) {
    // 敌人数量达到上限，不刷怪，且清空计时器（防止敌人一死亡就直接刷出来）
    if (!this.canAddEnemy()) {
      this.刷怪计时器 = 0;
      return;
    }
    this.刷怪计时器 += dt * this.get刷怪倍速();
    if (this.刷怪计时器 < this.刷怪间隔) {
      return;
    }
    const enemy = this.genEnemy();
    const eventData = { entity: enemy.instance, isCancelled: false };
    combatEvents.emit(EventType.生成实体, eventData);
    if (eventData.isCancelled) {
      return;
    }
    this.刷怪计时器 = 0;
    this.敌人.push(enemy.instance);
  }

  canAddEnemy() {
    return this.敌人.length < this.最大敌人数;
  }

  clearEnemies() {
    this.敌人.forEach((enemy) => {
      combatEvents.emit(EventType.移除实体, { entity: enemy });
    });
    this.敌人.length = 0;
  }

  removeEnemy(enemy, isForced = false) {
    const index = this.敌人.indexOf(enemy);
    if (index === -1) {
      return;
    }
    const eventData = { entity: enemy, isCancelled: false };
    combatEvents.emit(EventType.移除实体, eventData);
    if (isForced || !eventData.isCancelled) {
      this.敌人.splice(index, 1);
    }
  }

  determineEnemyToGen() {
    const enemies = Object.values(this.enemies);
    // 不会通过达成一定击杀数量刷新BOSS，只能靠运气
    if (this.必刷BOSS刷怪数量 < 0) {
      return sampleWeighted(enemies);
    }
    // 如果刷怪数量达到必刷BOSS刷怪数量，刷出BOSS
    const boss = enemies.find((enemy) => enemy.isBoss);
    if (boss && this.刷怪数量 > this.必刷BOSS刷怪数量) {
      return boss;
    }
    return sampleWeighted(enemies);
  }

  /**
   * 强制生成敌人。调用该方法前请手动判断是否可以生成敌人
   */
  genEnemy() {
    this.刷怪数量 += 1;
    const enemyLiteral = this.determineEnemyToGen();
    if (enemyLiteral.isBoss) {
      this.刷怪数量 = 0;
      this.clearEnemies();
    }
    return {
      instance: new 敌人(enemyLiteral.config, !!enemyLiteral.isBoss, this.statMultiplier),
    };
  }

  /**
   * @param {number} value
   * @returns {boolean} 是否改变了区域等级
   */
  addLevel(value) {
    return this.setLevel(this.level + value);
  }

  /**
   * @param {number} newLevel
   * @returns {boolean} 是否改变了区域等级
   */
  setLevel(newLevel) {
    const prevLevel = this.level;
    this.level = _.clamp(newLevel, 0, this.maxLevel);
    const changed = prevLevel !== this.level;
    if (changed) {
      this.updateStatMultiplier();
    }
    return changed;
  }

  isAtMaxLevel() {
    return this.level === this.maxLevel;
  }

  /**
   * @param {number} value
   * @returns {boolean} 是否改变了区域最大等级
   */
  addMaxLevel(value) {
    return this.setMaxLevel(this.maxLevel + value);
  }

  /**
   *
   * @param {number} newLevel
   * @returns {boolean} 是否改变了区域最大等级
   */
  setMaxLevel(newLevel) {
    const prevMaxLevel = this.maxLevel;
    this.maxLevel = _.clamp(newLevel, 0, this.levelCap);
    return prevMaxLevel !== this.maxLevel;
  }

  get刷怪计时去掉倍速() {
    return this.刷怪计时器 / this.get刷怪倍速();
  }

  get实际刷怪间隔() {
    return this.刷怪间隔 / this.get刷怪倍速();
  }
}

export { 战斗区域, configs, configs as areaConfigs };
