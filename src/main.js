import { setInterval } from 'worker-timers';

import 玩家 from './player/玩家.js';
import * as 玩家管理器 from './player/玩家管理器.js';
import * as 战斗管理器 from './combat/战斗管理器.js';
import addToWindow from './debug.js';
import {
  registerEvents as registerHTMLEvents,
  setupHTML,
  updateHTML,
  setHTMLInterval,
} from './events/htmlHandler.js';
import { config, settings } from './settings.js';

const update = (dt) => {
  战斗管理器.update(dt);
  const player = 玩家管理器.getPlayer();
  const enemies = 战斗管理器.getEnemiesInCombat();
  // 先回复生命值，血量（玩家在战斗外也能回复，怪物没有脱战一说）
  player.update(dt);
  enemies.forEach((enemy) => enemy.update(dt));
  // 再进行战斗动作
  战斗管理器.updateCombat(player, dt);
  enemies.forEach((enemy) => 战斗管理器.updateCombat(enemy, dt));
};

window.onload = () => {
  // Setup game
  const player = new 玩家();
  addToWindow('player', player);
  玩家管理器.init(player);
  玩家管理器.读档();
  战斗管理器.init();
  战斗管理器.registerEvents();
  // Initial game update
  // 不应该在update里的任何function直接call HTML function，应该用emit event的方式，否则初次更新会出现问题，
  // 因为HTML的初始化是在游戏初始化后的。而且，游戏逻辑里也不应该依赖HTML function，应该emit event，让HTML function自己来更新
  update(0);

  // 在所有数据都加载完毕后，设置HTML
  setupHTML();
  registerHTMLEvents();
  // Initial HTML update
  updateHTML({ player });

  // 设置update loop
  // Ideally 200 ticks per second
  let lastUpdate = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = (now - lastUpdate) / 1000;
    lastUpdate = now; // 用于计算到下次回调实际的间隔时间
    update(dt * settings.游戏倍速);
  }, 5);

  // 20 ticks per second
  setHTMLInterval(config.默认HTML更新间隔);

  console.log('游戏加载完成');
  console.log('玩家信息：', player);
};

const setGameSpeed = (speed) => {
  if (speed < 0 || speed > 10000) {
    console.error('游戏倍速必须在0到10000之间');
    return;
  }
  settings.游戏倍速 = speed;
};

addToWindow('setGameSpeed', setGameSpeed);

window.clearLocalStorage = () => {
  localStorage.clear();
  window.disableSave = true;
};

window.onbeforeunload = () => {
  if (window.disableSave) {
    return;
  }
  // 保存玩家存档
  玩家管理器.存档();
  // 保存其他游戏信息
};
