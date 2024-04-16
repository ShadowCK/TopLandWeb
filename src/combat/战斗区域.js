import * as math from 'mathjs';
import 敌人信息 from './敌人信息.js';
import * as settings from '../settings.js';

const configs = {
  新大陆: {
    name: '新大陆',
    level: 1,
    maxLevel: 1,
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
      },
    },
  },
};

class 战斗区域 {
  // 配置数据
  name = '下水道';

  level = 1;

  maxLevel = 1;

  levelCap = 100;

  enemies = {
    老鼠: {
      config: 敌人信息.老鼠,
      weight: 1,
    },
  };

  // 非配置数据
  敌人 = [];

  最大敌人数 = settings.config.最大敌人数;

  刷怪间隔 = settings.config.刷怪间隔;

  刷怪计时器 = 0;

  // 达到一定次数，必定刷新BOSS
  battles = 0;

  constructor(config) {
    Object.assign(this, config);
  }

  update(dt) {
    // 敌人数量达到上限，不刷怪，且清空计时器（防止敌人一死亡就直接刷出来）
    if (!this.canAddEnemy()) {
      this.刷怪计时器 = 0;
      return;
    }
    // 无敌人时刷怪速度加快
    const 刷怪倍速 = this.敌人.length === 0 ? settings.config.无敌人刷怪倍速 : 1;
    this.刷怪计时器 += dt * 刷怪倍速;
    if (this.刷怪计时器 < this.刷怪间隔) {
      return;
    }
    this.刷怪计时器 = 0;
    this.敌人.push(this.genEnemy());
  }

  canAddEnemy() {
    return this.敌人.length < this.最大敌人数;
  }

  genEnemy() {
    const enemies = Object.values(this.enemies);
    const totalWeight = enemies.reduce((acc, enemy) => acc + enemy.weight, 0);
    const rand = Math.random() * totalWeight;
    let sum = 0;
    const result = enemies.find((enemy) => {
      sum += enemy.weight;
      return rand < sum;
    });
    return result;
  }

  get难度加成 = () =>
    math.evaluate('(maxLevel - level)^1.5', { level: this.level, maxLevel: this.maxLevel });
}

export { 战斗区域, configs };
