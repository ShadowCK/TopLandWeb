/** @type {import('./玩家.js').default} */
let player = null;

/**
 * 为了防止循环依赖，这里不直接引入玩家类并创建玩家
 * 而是在主类实例化玩家，初始化时传入玩家实例
 * @param {import('./玩家.js').default} p
 */
const init = (p) => {
  player = p;
};

const getPlayer = () => player;

const 存档 = () => {
  player.玩家存档.存档();
};

export { init, getPlayer, 存档 };
