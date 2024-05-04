import { setInterval } from 'worker-timers';

import 玩家 from './player/玩家.js';
import * as 玩家管理器 from './player/玩家管理器.js';
import * as 战斗管理器 from './combat/战斗管理器.js';
import { addToWindow } from './debug.js';
import {
  registerEvents as registerHTMLEvents,
  setupHTML,
  updateHTML,
  setHTMLInterval,
} from './events/htmlHandler.js';
import { settings } from './settings.js';
import * as settingsHandler from './settingsHandler.js';
import * as 组件管理器 from './skills/组件管理器.js';
import * as 技能管理器 from './skills/技能管理器.js';
import * as debug from './debug.js';

const update = (dt) => {
  战斗管理器.update(dt);
  const player = 玩家管理器.getPlayer();
  const entities = 战斗管理器.getEntitiesInCombat(false);
  // 先回复生命值，血量（玩家在战斗外也能回复，怪物没有脱战一说）
  player.update(dt);
  entities.forEach((enemy) => enemy.update(dt));
  // 再进行战斗动作
  战斗管理器.updateCombat(player, dt);
  entities.forEach((enemy) => 战斗管理器.updateCombat(enemy, dt));
};

window.onload = async () => {
  // Setup game
  await 组件管理器.registerComponents();
  技能管理器.initialize();
  debug.log('加载的技能', 技能管理器.getSkills());

  const player = new 玩家();
  addToWindow('player', player);
  玩家管理器.init(player);
  玩家管理器.读档();
  战斗管理器.registerEvents();
  settingsHandler.registerEvents();
  // Initial game update
  // 不应该在update里的任何function直接call HTML function，应该用emit event的方式，否则初次更新会出现问题，
  // 因为HTML的初始化是在游戏初始化后的。而且，游戏逻辑里也不应该依赖HTML function，应该emit event，让HTML function自己来更新
  update(0);

  // 在所有数据都加载完毕后，设置HTML
  setupHTML();
  registerHTMLEvents();
  // Initial HTML update
  updateHTML({ player }, 0);

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
  setHTMLInterval(settings.HTML更新间隔);

  console.log('游戏加载完成');
  console.log('玩家信息：', player);
};

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
  console.log('游戏存档已保存');
};
