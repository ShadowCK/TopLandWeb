import _ from 'lodash';
import 实体 from './实体.js';
import { defaultStats, statTypes } from './战斗属性.js';

class 玩家 extends 实体 {
  最高专精等级 = 0;

  constructor(params) {
    super();

    // 应用职业属性

    // 更新玩家的属性
  }

  updateStats() {
    const { level } = this.职业;
    // 职业本身的属性
    _.forEach(statTypes, (type) => {
      const statGrowth = this.职业.statGrowth[type] || defaultStats[type];
      if (!statGrowth) {
        this.stats[type] = 0;
        return;
      }
      this.stats[type] = statGrowth[0] + statGrowth[1] * (level - 1);
    });

    // TODO: 装备的属性加成
  }

  转生() {
    // TODO
  }
}

export default 玩家;
