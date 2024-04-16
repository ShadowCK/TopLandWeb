import * as math from 'mathjs';
import 敌人信息 from './敌人信息.js';
import * as settings from '../settings.js';
import 敌人 from './敌人.js';
import { EventType, combatEvents } from '../events/事件管理器.js';

const configs = {
  下水道: {
    name: '下水道',
    description: '下水道里面有很多老鼠，还有一些其他的东西。',
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
        weight: 0.1,
        isBoss: true,
      },
    },
  },
  新大陆: {
    name: '新大陆',
    description: '魔能大陆重建前魔能使们停留的地方。昔日的荣光已经不再，只剩下愚蠢的后世文明。',
    enemies: {
      菜鸡魔能使: {
        config: 敌人信息.菜鸡魔能使,
        weight: 100,
      },
      新手剑士: {
        config: 敌人信息.新手剑士,
        weight: 50,
      },
      装逼的骑士: {
        config: 敌人信息.装逼的骑士,
        weight: 1,
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

  // 非配置数据
  level = 1;

  maxLevel = 1;

  levelCap = settings.config.最大区域等级;

  敌人 = [];

  最大敌人数 = settings.config.最大敌人数;

  刷怪间隔 = settings.config.刷怪间隔;

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
    this.statMultiplier = this.calcStatMultiplier();
  }

  update(dt) {
    // 敌人数量达到上限，不刷怪，且清空计时器（防止敌人一死亡就直接刷出来）
    if (!this.canAddEnemy()) {
      this.刷怪计时器 = 0;
      return;
    }
    // 无敌人时刷怪速度加快
    const 刷怪倍速 = this.敌人.length === 0 ? settings.config.无敌人刷怪倍速 : 1;
    this.刷怪计时器 = Math.min(this.刷怪计时器 + dt * 刷怪倍速, this.刷怪间隔);
    if (this.刷怪计时器 < this.刷怪间隔) {
      return;
    }
    const enemy = this.genEnemy();
    const eventData = { entity: enemy, isCancelled: false };
    combatEvents.emit(EventType.生成实体, eventData);
    if (eventData.isCancelled) {
      return;
    }
    this.刷怪计时器 = 0;
    this.敌人.push(enemy);
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

  /**
   * 强制生成敌人。调用该方法前请手动判断是否可以生成敌人
   */
  genEnemy() {
    const enemies = Object.values(this.enemies);
    this.刷怪数量 += 1;
    let enemyLiteral;
    const boss = enemies.find((enemy) => enemy.isBoss);
    if (boss && this.刷怪数量 > settings.config.必定刷新BOSS刷怪数量) {
      this.刷怪数量 = 0;
      this.clearEnemies();
      enemyLiteral = boss;
    } else {
      const totalWeight = enemies.reduce((acc, enemy) => acc + enemy.weight, 0);
      const rand = Math.random() * totalWeight;
      let sum = 0;
      enemyLiteral = enemies.find((enemy) => {
        sum += enemy.weight;
        return rand < sum;
      });
    }
    return new 敌人(enemyLiteral.config, this.statMultiplier);
  }

  calcStatMultiplier = () =>
    math.evaluate('(maxLevel - level)^1.5', { level: this.level, maxLevel: this.maxLevel });
}

export { 战斗区域, configs };
