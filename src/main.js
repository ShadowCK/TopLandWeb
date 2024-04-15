import _ from 'lodash';
import { clearInterval, clearTimeout, setInterval, setTimeout } from 'worker-timers';

import 玩家存档 from './player/玩家存档.js';
import * as debug from './debug.js';
import 玩家 from './player/玩家.js';
import * as 玩家管理器 from './player/玩家管理器.js';
import * as 战斗管理器 from './combat/战斗管理器.js';
import classConfigs from './classes/职业信息.js';
import 职业 from './classes/职业.js';

/**
 * @param {{player:玩家}} params
 */
const updateHTML = (params) => {
  const genElementForStats = (parent, value, key) => {
    if (_.isObject(value) && !Array.isArray(value)) {
      const label = $(`<div class="ui blue horizontal label">${key}</div>`);
      const child = $(`<div class="ui relax list"></div>`);
      parent.append(label, child);
      _.forEach(value, (v, k) => {
        genElementForStats(child, v, k);
      });
      return;
    }
    // 属性成长作为数组存储
    const formatted = Array.isArray(value)
      ? value.map((v) => _.round(v, 2)).join('+')
      : _.round(value, 0);
    const html = `
    <div class="item">
      <div class="ui horizontal label">${key}</div>${formatted}
    </div>
    `;
    parent.append(html);
  };

  const { player } = params;
  const { 职业: 玩家职业 } = player;
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

  const 当前属性 = $('#角色面板-当前属性');
  当前属性.empty();
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

const setupHTML = () => {
  // 启用 Semantic UI 的标签页功能
  $('.menu .item').tab();
};

window.onload = () => {
  setupHTML();

  const player = new 玩家();
  玩家管理器.init(player);

  const defaultSaveData = new 玩家存档(null);
  defaultSaveData.职业 = new 职业(classConfigs.初心者);
  const playerSave = 玩家存档.读档(defaultSaveData);
  playerSave.应用存档();

  战斗管理器.init();

  // 200 ticks per second
  setInterval(update, 5);

  // 20 ticks per second
  setInterval(() => updateHTML({ player: 玩家管理器.getPlayer() }), 50);

  console.log('游戏加载完成');
  console.log('玩家信息：', 玩家管理器.getPlayer());
  window.player = player;
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
