import _ from 'lodash';
import 职业 from '../classes/职业.js';
import classConfigs from '../classes/职业信息.js';

/**
 * @param {玩家} player
 * @returns
 */
const 可以提升专精等级 = (player) => player.职业.level === player.职业.getMaxLevel();

/**
 * @param {玩家} player
 * @param {string} 新职业名称
 * @returns {boolean} 是否可以转生
 */
const 可以转生 = (player, 新职业名称) => {
  const 新职业配置 = classConfigs[新职业名称];
  if (新职业配置 === undefined) {
    console.error('新职业不存在');
    return false;
  }
  const requirementsMet = !_.some(
    新职业配置.requirements,
    (value, key) => _.get(player, `专精等级.${key}`, 0) < value,
  );
  return requirementsMet;
};

/**
 * @param {玩家} player
 * @param {string} 新职业名称
 * @returns {boolean} 是否成功转生
 */
const 转生 = (player, 新职业名称) => {
  if (!可以转生(player, 新职业名称)) {
    return false;
  }
  if (可以提升专精等级(player)) {
    const 当前职业名 = player.职业.name;
    const 新专精等级 = _.get(player, `专精等级.${当前职业名}`, 0) + 1;
    player.专精等级[当前职业名] = 新专精等级;
    if (新专精等级 > player.最高专精等级) {
      player.最高专精等级 = 新专精等级;
    }
  }
  // 清除玩家属性，否则旧职业有，新职业没有的属性会保留
  // 同时清除其他不应该保留的东西。
  player.reset();
  const 新职业配置 = classConfigs[新职业名称];
  新职业配置.expertiseLevel = _.get(player, `专精等级.${新职业名称}`, 0);
  player.抽奖用专精等级 = 新职业配置.expertiseLevel;
  player.设置职业(new 职业(新职业配置));
  player.玩家存档.职业 = player.职业;
  return true;
};

export { 可以转生, 可以提升专精等级, 转生 };
