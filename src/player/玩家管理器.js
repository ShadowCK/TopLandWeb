import { 玩家存档 } from './玩家存档.js';
import classConfigs from '../classes/职业信息.js';

/** @type {玩家} */
let player = null;

/**
 * 为了防止循环依赖，这里不直接引入玩家类并创建玩家
 * 而是在主类实例化玩家，初始化时传入玩家实例
 * TODO: 在一番代码优化后，耦合消失了！可以import玩家创建玩家实例了！
 * @param {玩家} p
 */
const init = (p) => {
  player = p;
};

const getPlayer = () => player;

const 打包存档数据 = () => {
  if (!player.玩家存档) {
    console.error('玩家存档不存在');
    return null;
  }
  return player.玩家存档.打包存档数据();
};

const 存档 = () => {
  const save = player.玩家存档;
  if (!save) {
    console.error('玩家存档不存在');
    return;
  }
  save.存档();
};

const 读档 = () => {
  const defaultSaveData = {
    职业: classConfigs.初心者,
  };
  new 玩家存档(player, defaultSaveData).应用存档();
};

export { init, getPlayer, 存档, 读档, 打包存档数据 };
