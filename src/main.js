import _ from 'lodash';
import { clearInterval, clearTimeout, setInterval, setTimeout } from 'worker-timers';

import 玩家存档 from './player/玩家存档.js';
import * as debug from './debug.js';
import 玩家 from './player/玩家.js';
import * as 玩家管理器 from './player/玩家管理器.js';
import * as 战斗管理器 from './combat/战斗管理器.js';
import classConfigs from './classes/职业信息.js';
import 职业 from './classes/职业.js';
import { genElementForStats, genProgressBar, updateProgressBar } from './htmlHelper.js';
import { statTypes } from './combat/战斗属性.js';

const setupHTML = () => {
  // 启用 Semantic UI 的标签页功能
  $('.menu .item').tab();

  const 角色面板进度条 = $('#角色面板-进度条');
  genProgressBar('角色面板-生命值进度条', 角色面板进度条, 'red', '生命值').wrap(
    $('<div class="column"></div>'),
  );
  genProgressBar('角色面板-魔法值进度条', 角色面板进度条, 'blue', '魔法值').wrap(
    $('<div class="column"></div>'),
  );
  genProgressBar('角色面板-经验值进度条', 角色面板进度条, 'green', '经验值').wrap(
    '<div class="column"></div>',
  );
};

/**
 * @param {{player:玩家}} params
 */
const updateHTML = (params) => {
  const { player } = params;
  const { 职业: 玩家职业 } = player;

  // 更新角色面板
  const 职业名称 = $('#角色面板-职业名称');
  职业名称.text(玩家职业.name);
  const 职业描述 = $('#角色面板-职业描述');
  职业描述.text(玩家职业.description);
  const 职业等级 = $('#角色面板-职业等级');
  职业等级.text(`${玩家职业.level}/${玩家职业.getMaxLevel()}`);
  const 职业经验值 = $('#角色面板-职业经验值');
  const requiredExp = 玩家职业.getExpToNextLevel();
  职业经验值.text(
    `${_.floor(玩家职业.exp)}/${_.floor(requiredExp)} (${_.round(
      (玩家职业.exp / requiredExp) * 100,
      2,
    )}%)`,
  );

  updateProgressBar(
    $('#角色面板-生命值进度条'),
    player.生命值,
    player.getStat2(statTypes.最大生命值),
    '生命值: {value} / {total}',
  );
  updateProgressBar(
    $('#角色面板-魔法值进度条'),
    player.魔法值,
    player.getStat2(statTypes.最大魔法值),
    '魔法值: {value} / {total}',
  );
  updateProgressBar(
    $('#角色面板-经验值进度条'),
    玩家职业.exp,
    requiredExp,
    '经验值: {value} / {total}',
  );

  const 当前属性 = $('#角色面板-当前属性');
  当前属性.empty();
  // FIXME: 最好是事先创建这些元素，然后更新值，而不是每次都重新创建
  genElementForStats(当前属性, player.生命值, '生命值', 'red');
  genElementForStats(当前属性, player.魔法值, '魔法值', 'blue');
  _.forEach(player.stats, (value, key) => {
    genElementForStats(当前属性, value, key);
  });

  const 属性成长 = $('#角色面板-属性成长');
  属性成长.empty();
  _.forEach(player.职业.statGrowth, (value, key) => {
    genElementForStats(属性成长, value, key);
  });
};

const update = () => {};

let htmlWorkerId = null;
const setHTMLInterval = (delay) => {
  if (htmlWorkerId != null) {
    clearInterval(htmlWorkerId);
  }
  htmlWorkerId = setInterval(() => updateHTML({ player: 玩家管理器.getPlayer() }), delay);
};

window.setHTMLInterval = setHTMLInterval;

window.onload = () => {
  const player = new 玩家();
  玩家管理器.init(player);

  const defaultSaveData = new 玩家存档(null);
  defaultSaveData.职业 = new 职业(classConfigs.初心者);
  const playerSave = 玩家存档.读档(defaultSaveData);
  playerSave.应用存档();

  战斗管理器.init();

  console.log('游戏加载完成');
  console.log('玩家信息：', 玩家管理器.getPlayer());
  window.player = player;

  // 在所有数据都加载完毕后，设置HTML
  setupHTML();

  // 设置update loop
  // 200 ticks per second
  setInterval(update, 5);

  // 20 ticks per second
  setHTMLInterval(50);
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
  玩家管理器.getPlayer().玩家存档.存档();
  // 保存其他游戏信息
};
