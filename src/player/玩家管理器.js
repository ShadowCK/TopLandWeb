import 玩家存档 from './玩家存档.js';
import 职业 from '../classes/职业.js';
import classConfigs from '../classes/职业信息.js';

/** @type {import('./玩家.js').default} */
let player = null;

/**
 * 为了防止循环依赖，这里不直接引入玩家类并创建玩家
 * 而是在主类实例化玩家，初始化时传入玩家实例
 * TODO: 在一番代码优化后，耦合消失了！可以import玩家创建玩家实例了！
 * @param {import('./玩家.js').default} p
 */
const init = (p) => {
  player = p;
};

const getPlayer = () => player;

const 存档 = () => {
  const save = player.玩家存档;
  if (!save) {
    console.error('玩家存档不存在');
    return;
  }
  save.存档();
};

const 读档 = () => {
  const defaultSave = new 玩家存档(null, null);
  defaultSave.职业 = new 职业(classConfigs.初心者);
  const playerSave = 玩家存档.读档(defaultSave);
  playerSave.应用存档(player);
};

export { init, getPlayer, 存档, 读档 };
