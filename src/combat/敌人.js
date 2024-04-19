import 实体 from './实体.js';
import 职业 from '../classes/职业.js';

class 敌人 extends 实体 {
  掉落 = [];

  /** 敌人死亡掉落的金钱 */
  金钱 = 0;

  /** 敌人死亡掉落的经验值 */
  经验值 = 0;

  statMultiplier = 1;

  isBoss = false;

  config = null;

  constructor(enemyConfig, isBoss = false, statMultiplier = 1) {
    super();
    const copy = JSON.parse(JSON.stringify(enemyConfig));
    Object.assign(this, copy);
    this.isBoss = isBoss;
    this.statMultiplier = statMultiplier;
    this.config = enemyConfig;
    this.设置职业(new 职业(enemyConfig.职业));
  }

  updateStats() {
    super.updateStats(this.statMultiplier);
  }
}

export default 敌人;
