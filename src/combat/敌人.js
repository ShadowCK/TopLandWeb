import 实体 from './实体.js';
import 职业 from '../classes/职业.js';

class 敌人 extends 实体 {
  掉落 = [];

  statMultiplier = 1;

  constructor(enemyConfig, statMultiplier = 1) {
    super();
    this.statMultiplier = statMultiplier;
    this.设置职业(new 职业(enemyConfig.职业));
  }

  updateStats() {
    super.updateStats(this.statMultiplier);
  }
}

export default 敌人;
