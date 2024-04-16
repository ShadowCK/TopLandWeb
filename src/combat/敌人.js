import 实体 from './实体.js';
import 职业 from '../classes/职业.js';

class 敌人 extends 实体 {
  掉落 = [];

  /** 敌人死亡掉落的金钱 */
  金钱 = 0;

  /** 敌人死亡掉落的经验值 */
  经验值 = 0;

  statMultiplier = 1;

  constructor(enemyConfig, statMultiplier = 1) {
    super();
    Object.assign(this, enemyConfig);
    this.statMultiplier = statMultiplier;
    this.设置职业(new 职业(enemyConfig.职业));
  }

  updateStats() {
    super.updateStats(this.statMultiplier);
  }
}

export default 敌人;
