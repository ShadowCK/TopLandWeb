import _ from 'lodash';
import 实体 from '../combat/实体.js';
import 玩家存档 from './玩家存档.js';

class 玩家 extends 实体 {
  玩家存档 = null;

  constructor(params) {
    super();

    // 应用职业属性

    // 更新玩家的属性
  }

  updateStats() {
    const { statGrowth, level } = this.职业;
    // 递归函数来处理stats
    const processStats = (stats, path = []) => {
      _.forEach(stats, (value, key) => {
        const currentPath = path.concat(key);
        if (Array.isArray(value)) {
          // 如果是数组，计算值并设置
          const [base, scale] = value;
          _.set(this.stats, currentPath, base + scale * (level - 1));
        } else if (_.isObject(value)) {
          // 如果是对象，递归处理
          processStats(value, currentPath);
        }
      });
    };

    // 调用递归函数处理所有stats
    processStats(statGrowth);

    // TODO: 装备的属性加成
    // 也可以用processStats函数处理
  }

  转生() {
    // TODO
  }
}

export default 玩家;
