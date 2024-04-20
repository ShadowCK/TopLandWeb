import { setInterval, clearInterval } from 'worker-timers';
import _ from 'lodash';
import {
  labelHTML,
  genLabel,
  genElementForStats,
  genProgressBar,
  updateProgressBar,
  changeTab,
  getCombatLayout,
  genCombatLayout,
  updateCombatLayout,
  config as htmlConfig,
  genInventory,
  genEquipments,
  loadAndRenderMarkdown,
} from '../htmlHelper.js';
import * as 玩家管理器 from '../player/玩家管理器.js';
import * as 战斗管理器 from '../combat/战斗管理器.js';
import classConfigs from '../classes/职业信息.js';
import { generalEvents, combatEvents, EventType } from './事件管理器.js';
import { get最高专精等级经验倍率, settings } from '../settings.js';
import { StatType } from '../combat/战斗属性.js';
import { templateFromElement, getMaxLevel } from '../utils.js';
import { 可以提升专精等级, 可以转生, 转生 } from '../reincarnate/转生.js';
import addToWindow from '../debug.js';

let htmlWorkerId = null;

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
  职业专精等级.html(
    `${玩家职业.expertiseLevel}（最高${
      player.最高专精等级
    } <i class="angle double right icon"></i>${_.round(
      get最高专精等级经验倍率(player.最高专精等级),
      2,
    )}X 经验值）`,
  );
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
    player.getStat2(StatType.最大生命值),
    htmlConfig.生命条格式,
  );
  updateProgressBar(
    $('#角色面板-魔法值进度条'),
    player.魔法值,
    player.getStat2(StatType.最大魔法值),
    htmlConfig.魔法条格式,
  );
  updateProgressBar($('#角色面板-经验值进度条'), 玩家职业.exp, requiredExp, htmlConfig.经验条格式);

  const 当前属性 = $('#角色面板-当前属性');
  当前属性.empty();
  // FIXME: 最好是事先创建这些元素，然后更新值，而不是每次都重新创建
  genElementForStats(player, 当前属性, player.生命值, '生命值', 'red');
  genElementForStats(player, 当前属性, player.魔法值, '魔法值', 'blue');
  _.forEach(player.stats, (value, key) => {
    genElementForStats(player, 当前属性, value, key);
  });

  const 属性成长 = $('#角色面板-属性成长');
  属性成长.empty();
  _.forEach(player.职业.statGrowth, (value, key) => {
    genElementForStats(player, 属性成长, value, key);
  });

  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  // 即使不在战斗，也更新玩家的生命条等信息。
  updateCombatLayout(getCombatLayout(战斗面板实体列表, player), player, {isPlayer : true});
  const enemies = 战斗管理器.getEnemiesInCombat();
  enemies.forEach((enemy) => updateCombatLayout(getCombatLayout(战斗面板实体列表, enemy), enemy, {isEnemy : true}));
};

const setupHTML = () => {
  loadAndRenderMarkdown('./更新日志与计划更新.md', $('#更新日志面板'));

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
        const 专精等级 = player.专精等级[classConfig.name] || 0;
        const button = $(`<div class="ui button">${classConfig.name} +${专精等级}</div>`);
        可转生职业.append(button);
        button.on('click', () => {
          $.modal('确认转生', classConfig);
        });
      });
    }
  };

  $.fn.modal.settings.templates.确认转生 = function f(classConfig) {
    const player = 玩家管理器.getPlayer();
    const 当前职业名 = player.职业.name;
    const 新职业名称 = classConfig.name;
    const canLevelUpExpertise = 可以提升专精等级(player);
    let 新职业专精等级 = player.专精等级[新职业名称] || 0;
    if (新职业名称 === 当前职业名 && canLevelUpExpertise) {
      新职业专精等级 += 1;
    }
    const 新职业最大等级 = getMaxLevel(classConfig.maxLevel, 新职业专精等级);

    return {
      class: 'chinese',
      title: `转生成为${classConfig.name}`,
      closeIcon: true,
      content: `
      ${canLevelUpExpertise ? genLabel('专精等级UP！', '', 'green').html() : ''}
      <div>原职业：${当前职业名}</div>
      <div>新职业：${classConfig.name} 1/${新职业最大等级} +${新职业专精等级}</div>
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
                displayTime: 2000,
                class: 'success center aligned chinese',
                showProgress: 'bottom',
                position: 'top attached',
                title: '转生成功',
                message: `你现在是一名${classConfig.name}了`,
              });
              // 虽然 return true 会自动关闭模态框，但是在这里切换标签页再关闭会导致BUG，
              // 让dimmer不会消失（永远阻止用户操作）。所以手动关闭。
              this.hide();
              changeTab('角色面板');
              return true;
            }
            $.toast({
              displayTime: 5000,
              class: 'error chinese',
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

  // 启用 Semantic UI 的标签页功能
  $('.menu .item').tab({
    onVisible,
  });

  // 角色面板
  const 角色面板进度条 = $('#角色面板-进度条');
  genProgressBar({
    id: '角色面板-生命值进度条',
    parent: 角色面板进度条,
    color: 'red',
    format: htmlConfig.生命条格式,
  }).wrap($('<div class="column"></div>'));
  genProgressBar({
    id: '角色面板-魔法值进度条',
    parent: 角色面板进度条,
    color: 'blue',
    format: htmlConfig.魔法条格式,
  }).wrap($('<div class="column"></div>'));
  genProgressBar({
    id: '角色面板-经验值进度条',
    parent: 角色面板进度条,
    color: 'green',
    format: htmlConfig.经验条格式,
  }).wrap('<div class="column"></div>');

  // 区域面板
  const 区域面板 = $('#区域面板');
  _.forEach(战斗管理器.所有战斗区域, (战斗区域) => {
    const 敌人信息 = Object.values(战斗区域.enemies)
      .map((areaEnemyConfig) => {
        const enemyConfig = areaEnemyConfig.config;
        const label = areaEnemyConfig.isBoss ? labelHTML('BOSS', '', 'yellow', true) : '';
        return `
        <div class="column">
          <div class="ui segment">
          <div>${enemyConfig.职业.name}${label}</div>
            <div>金钱: ${enemyConfig.金钱}</div>
            <div>经验值: ${enemyConfig.经验值}</div>
          </div>
        </div>
      `;
      })
      .join('');
    const element = $(`
      <div class="ui segment">
        <h3 class="ui header">
          ${战斗区域.name}
          <div class="sub header">${战斗区域.description}</div>
        </h3>
        <div class="ui three column grid">
          ${敌人信息}
        </div>
        <div class="ui divider"></div>
        <button class="ui right labeled icon button">
          <i class="right arrow icon"></i>
          前往
        </button>
      </div>
      `);
    // 前往按钮
    element.find('button').on('click', () => {
      changeTab('战斗面板');
      战斗管理器.切换战斗区域(战斗区域);
    });
    区域面板.append(element);
  });

  // 战斗面板
  // 游戏初始化后，*如果玩家没有在战斗区域*，隐藏区域信息。（这个判断是为了兼容以后的自动化，比如游戏一开始就自动前往一个区域。）
  const 战斗面板区域信息 = $('#战斗面板-区域信息');
  if (!战斗管理器.isPlayerInCombat()) {
    战斗面板区域信息.hide();
  }
  const 战斗面板离开按钮 = $('#战斗面板-离开按钮');
  战斗面板离开按钮.on('click', () => {
    changeTab('区域面板');
    战斗管理器.退出战斗区域();
  });
  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  const player = 玩家管理器.getPlayer();
  genCombatLayout(player, 战斗面板实体列表, { isPlayer: true });

  // 背包面板
  $('#背包面板').on('contextmenu', (e) => {
    // 防止玩家右键丢东西的时候，不小心打开浏览器的右键菜单
    e.preventDefault();
  });
  genEquipments();
  genInventory();
};

// 可以根据玩家的需求，重置UI更新频率
const setHTMLInterval = (delay) => {
  if (htmlWorkerId != null) {
    clearInterval(htmlWorkerId);
  }
  htmlWorkerId = setInterval(() => updateHTML({ player: 玩家管理器.getPlayer() }), delay);
};

const clearHTMLInterval = () => {
  if (htmlWorkerId != null) {
    clearInterval(htmlWorkerId);
    htmlWorkerId = null;
  }
};

addToWindow('setHTMLInterval', setHTMLInterval);
addToWindow('clearHTMLInterval', clearHTMLInterval);

// 清除实体在战斗面板的显示
const clearEntityInCombatTab = (entity) => {
  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  战斗面板实体列表.find(`#${entity.uuid}`).remove();
};

let isUserOnPage = true;
let isDeathPopupVisible = false;

$(document).on('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    isUserOnPage = true;
    // 重新设置HTML更新频率
    console.log('欢迎回来！恢复更新HTML');
    setHTMLInterval(settings.HTML更新间隔);
  } else if (document.visibilityState === 'hidden') {
    isUserOnPage = false;
    // 页面不可见时，不更新HTML（不包括死亡弹出的fomantic-ui的popup等）
    console.log('页面不可见，停止更新HTML');
    clearHTMLInterval();
  }
});

const registerEvents = () => {
  combatEvents.on(EventType.实体死亡, ({ entity }) => {
    if (entity !== 玩家管理器.getPlayer()) {
      return;
    }
    if (isUserOnPage) {
      $.toast({
        title: '你死了！',
        message: `真是个菜鸡。`,
        class: 'error chinese',
        displayTime: 2000,
        showProgress: 'bottom',
      });
    } else if (!isDeathPopupVisible) {
      // 页面在后台时死亡，永久显示popup。直到点掉，不会再生成新的死亡提示，防止每次死亡弹出一个需要手动点掉的提示。
      $.toast({
        title: '你在不知不觉的时候死了！',
        message: `试试换个区域挂机吧。`,
        class: 'black chinese',
        displayTime: 0,
        onShow: () => {
          isDeathPopupVisible = true;
        },
        onHidden: () => {
          isDeathPopupVisible = false;
        },
      });
    }
    changeTab('角色面板');
  });

  combatEvents.on(EventType.生成实体, ({ entity, isCancelled }) => {
    if (isCancelled) {
      return;
    }
    $('#战斗面板-实体列表').append(genCombatLayout(entity));
  });

  combatEvents.on(EventType.移除实体, ({ entity }) => {
    clearEntityInCombatTab(entity);
  });

  combatEvents.on(EventType.进入战斗区域, (combatArea) => {
    $('#战斗面板-区域信息').show();
    $('#战斗面板-区域名称').text(combatArea.name);
    $('#战斗面板-区域描述').text(combatArea.description);
  });

  combatEvents.on(EventType.退出战斗区域, (_combatArea) => {
    $('#战斗面板-区域信息').hide();
  });

  generalEvents.on(EventType.获得物品, (_itemConfig) => {
    // 无脑刷新背包……
    console.log('获得物品，刷新背包');
    genInventory();
  });

  generalEvents.on(EventType.失去物品, (_itemConfig) => {
    // 无脑刷新背包……
    console.log('失去物品，刷新背包');
    genInventory();
  });

  generalEvents.on(EventType.穿上装备, ({ entity, _equipment }) => {
    if (entity !== 玩家管理器.getPlayer()) {
      return;
    }
    // 无脑刷新！太无脑了！
    genInventory();
    genEquipments();
  });

  generalEvents.on(EventType.脱下装备, ({ entity, _equipment }) => {
    if (entity !== 玩家管理器.getPlayer()) {
      return;
    }
    // 无脑刷新！太无脑了！
    genInventory();
    genEquipments();
  });
};

export { registerEvents, updateHTML, setupHTML, setHTMLInterval };
