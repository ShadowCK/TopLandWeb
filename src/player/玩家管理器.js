import 玩家 from './玩家.js';

let player = null;

const init = () => {
  player = new 玩家();
};

/**
 * @returns {玩家}
 */
const getPlayer = () => player;

export { init, getPlayer };
