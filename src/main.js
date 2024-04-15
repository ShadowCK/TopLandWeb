import _ from 'lodash';
import { clearInterval, setInterval } from 'worker-timers';

import 玩家存档 from './player/玩家存档.js';
import 玩家 from './player/玩家.js';
import * as 玩家管理器 from './player/玩家管理器.js';
import * as 战斗管理器 from './combat/战斗管理器.js';
import classConfigs from './classes/职业信息.js';
import 职业 from './classes/职业.js';
import { genLabel, genElementForStats, genProgressBar, updateProgressBar } from './htmlHelper.js';
import { statTypes } from './combat/战斗属性.js';
import { 可以提升专精等级, 可以转生, 转生 } from './reincarnate/转生.js';
import { getMaxLevel, templateFromElement } from './utils.js';

const setupHTML = () => {
  $.fn.modal.settings.templates.确认转生 = function f(classConfig) {
    const player = 玩家管理器.getPlayer();
    const 当前职业名 = player.职业.name;
    const 新职业名称 = classConfig.name;
    const canLevelUpExpertise = 可以提升专精等级(player);
    let 新职业专精等级 = player.玩家存档.专精等级[新职业名称] || 0;
    if (新职业名称 === 当前职业名 && canLevelUpExpertise) {
      新职业专精等级 += 1;
    }
    const 新职业最大等级 = getMaxLevel(classConfig.maxLevel, 新职业专精等级);

    return {
      class: 'chinese',
      title: `转生成为${classConfig.name}`,
      closeIcon: true,
      content: `
      ${canLevelUpExpertise ? genLabel('专精等级UP！', '', 'green').wrap('div').html() : ''}
      <div>原职业：${当前职业名}</div>
      <div>新职业：${classConfig.name} 1/${新职业最大等级}/${新职业专精等级}</div>
      `,
      actions: [
        {
          text: '确认',
          class: 'green',
          click: () => {
            // 再次检测是否可以转生，防止在等待确认时，玩家的状态发生变化
            // 这里没有复用player，也是为了防止玩家引用变化（尽管这不可能，但我觉得是好的实践）
            const result = 转生(玩家管理器.getPlayer(), classConfig.name);
            if (result) {
              $.toast({
                displayTime: 5000,
                class: 'green center aligned chinese',
                showProgress: 'bottom',
                position: 'top attached',
                title: '转生成功',
                message: `你现在是一名${classConfig.name}了`,
              });
              return true;
            }
            $.toast({
              displayTime: 5000,
              class: 'red chinese',
              showProgress: 'bottom',
              title: '转生失败！',
              message: `发生了一个意外错误`,
            });
            // 发生错误时不自动关闭，允许不信邪的玩家多点几次
            return false;
          },
        },
        {
          text: '取消',
          class: 'red',
        },
      ],
    };
  };

  const onVisible = (tabPath) => {
    if (tabPath === '转生面板') {
      const player = 玩家管理器.getPlayer();
      const element = $('#转生面板-无法提升专精');
      if (可以提升专精等级(player)) {
        element.hide();
      } else {
        const header = element.find('.header:first');
        const { 职业: playerClass } = player;
        templateFromElement(header, {
          等级: playerClass.level,
          最大等级: playerClass.getMaxLevel(),
        });
        element.show();
      }
      const 可转生职业 = $('#转生面板-可转生职业');
      可转生职业.empty();
      _.forEach(classConfigs, (classConfig) => {
        if (!可以转生(player, classConfig.name)) {
          return;
        }
        const button = $(`<div class="ui button">${classConfig.name}</div>`);
        可转生职业.append(button);
        button.on('click', () => {
          $.modal('确认转生', classConfig);
        });
      });
    }
  };

  // 启用 Semantic UI 的标签页功能
  $('.menu .item').tab({
    onVisible,
  });

  // 角色面板
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
  const 职业专精等级 = $('#角色面板-职业专精等级');
  职业专精等级.text(`${玩家职业.expertiseLevel}（最高${player.玩家存档.最高专精等级}）`);
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
