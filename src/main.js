import { clearInterval, clearTimeout, setInterval, setTimeout } from 'worker-timers';

import * as settings from './settings.js';
import * as debug from './debug.js';
import * as 玩家管理器 from './player/玩家管理器.js';
import * as 战斗管理器 from './combat/战斗管理器.js';

const updateHTML = () => {};

const update = () => {

    
  updateHTML();
};

window.onload = () => {
  玩家管理器.init();
  战斗管理器.init();

  // 200 ticks per second
  setInterval(update, 5);

  console.log('游戏加载完成');
  console.log('玩家信息：', 玩家管理器.getPlayer());
};

// TODO: save/load game
