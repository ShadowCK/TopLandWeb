import { clearInterval, clearTimeout, setInterval, setTimeout } from 'worker-timers';

import * as settings from './settings.js';
import * as debug from './debug.js';
import 玩家 from './player/玩家.js';
import * as 玩家管理器 from './player/玩家管理器.js';
import * as 战斗管理器 from './combat/战斗管理器.js';
import classConfigs from './classes/职业信息.js';
import 职业 from './classes/职业.js';

const updateHTML = () => {};

const update = () => {
  updateHTML();
};

window.onload = () => {
  const player = new 玩家();
  玩家管理器.init(player);
  战斗管理器.init();

  player.设置职业(new 职业(classConfigs.初心者));

  // 200 ticks per second
  setInterval(update, 5);

  console.log('游戏加载完成');
  console.log('玩家信息：', 玩家管理器.getPlayer());
  window.player = player;
};

// TODO: save/load game
