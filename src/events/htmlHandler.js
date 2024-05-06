import LZString from 'lz-string';
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
  Format,
  genEquipments,
  loadAndRenderMarkdown,
} from '../htmlHelper.js';
import * as 玩家管理器 from '../player/玩家管理器.js';
import * as 战斗管理器 from '../combat/战斗管理器.js';
import classConfigs from '../classes/职业信息.js';
import { generalEvents, combatEvents, EventType, HTMLEvents } from './事件管理器.js';
import { get最高专精等级经验倍率, settings, 计算抽奖奖励, 计算抽奖花费 } from '../settings.js';
import { StatType } from '../combat/战斗属性.js';
import { templateFromElement, getMaxLevel } from '../utils.js';
import { 可以提升专精等级, 可以转生, 转生 } from '../reincarnate/转生.js';
import { addToWindow, checkNotNull } from '../debug.js';
import { GameSettingName } from '../enums.js';
import { update as 更新战斗信息, 生成伤害信息, 生成治疗信息 } from '../战斗信息管理器.js';
import 背包界面 from '../items/背包界面.js';
import 技能栏界面 from '../skills/技能栏界面.js';
import * as 区域界面 from '../ui/区域界面.js';
import { 获取抽奖信息, 试抽Buff, 施加Buff, 扣除抽奖花费 } from '../shop/商店.js';

let lastUpdate = performance.now();
let htmlWorkerId = null;

const isUpdatingHTML = () => htmlWorkerId != null;

// #region 多次复用的函数
const 更新商店面板 = (player) => {
  templateFromElement(
    $('#商店面板-金钱抽奖信息'),
    {
      抽奖次数: player.金钱抽奖次数,
      抽奖花费: 计算抽奖花费(player.金钱抽奖次数, false),
      固定数值奖励倍率: _.round(计算抽奖奖励(player.金钱抽奖次数, true).base, 2),
      百分比奖励倍率: _.round(计算抽奖奖励(player.金钱抽奖次数, false).base, 2),
      剩余金钱: _.round(player.金钱),
    },
    true,
    false,
  );
  templateFromElement(
    $('#商店面板-专精抽奖信息'),
    {
      抽奖次数: player.专精抽奖次数,
      抽奖花费: 计算抽奖花费(player.专精抽奖次数, true),
      固定数值奖励倍率: _.round(计算抽奖奖励(player.专精抽奖次数, true).base, 2),
      百分比奖励倍率: _.round(计算抽奖奖励(player.专精抽奖次数, false).base, 2),
      剩余专精等级: player.抽奖用专精等级,
    },
    true,
    false,
  );
};

// #endregion

/**
 * @param {{player:玩家}} params
 */
const updateHTML = (params, dt) => {
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
    Format.生命条格式,
  );
  updateProgressBar(
    $('#角色面板-魔法值进度条'),
    player.魔法值,
    player.getStat2(StatType.最大魔法值),
    Format.魔法条格式,
  );
  updateProgressBar($('#角色面板-经验值进度条'), 玩家职业.exp, requiredExp, Format.经验条格式);

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

  // 更新战斗面板
  const 当前战斗区域 = 战斗管理器.get当前战斗区域();
  if (当前战斗区域 != null) {
    if (当前战斗区域.必刷BOSS刷怪数量 < 0) {
      $('#战斗面板-必刷BOSS进度条').parent().hide();
    } else {
      $('#战斗面板-必刷BOSS进度条').parent().show();
      updateProgressBar(
        $('#战斗面板-必刷BOSS进度条'),
        当前战斗区域.刷怪数量,
        当前战斗区域.必刷BOSS刷怪数量,
        Format.必刷BOSS进度条格式,
      );
    }
    updateProgressBar(
      $('#战斗面板-刷怪计时进度条'),
      当前战斗区域.get刷怪计时去掉倍速(),
      当前战斗区域.get实际刷怪间隔(),
      Format.刷怪计时进度条格式,
      2,
      false,
      0.1,
    );
  }
  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  // 即使不在战斗，也更新玩家的生命条等信息。
  updateCombatLayout(getCombatLayout(战斗面板实体列表, player), player, { isPlayer: true });
  const enemies = 战斗管理器.getEnemiesInCombat();
  enemies.forEach((enemy) =>
    updateCombatLayout(getCombatLayout(战斗面板实体列表, enemy), enemy, { isEnemy: true }),
  );
  更新战斗信息(dt);

  // 更新技能栏
  $('#技能栏').get(0).ui?.update();

  // 更新商店面板
  更新商店面板(player);
};

// 可以根据玩家的需求，重置UI更新频率
const setHTMLInterval = (delay) => {
  if (isUpdatingHTML()) {
    clearInterval(htmlWorkerId);
  }
  htmlWorkerId = setInterval(() => {
    const now = performance.now();
    const dt = (now - lastUpdate) / 1000;
    lastUpdate = now;
    updateHTML({ player: 玩家管理器.getPlayer() }, dt);
  }, delay);
};

const clearHTMLInterval = () => {
  if (isUpdatingHTML()) {
    clearInterval(htmlWorkerId);
    htmlWorkerId = null;
  }
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
      const 不能转生职业 = [];
      _.forEach(classConfigs, (classConfig) => {
        if (!可以转生(player, classConfig.name)) {
          不能转生职业.push(classConfig);
          return;
        }
        const 专精等级 = player.专精等级[classConfig.name] || 0;
        const button = $(`<div class="ui button">${classConfig.name} +${专精等级}</div>`);
        可转生职业.append(button);
        button.on('click', () => {
          $.modal('确认转生', classConfig);
        });
      });
      // 显示不能转生职业
      不能转生职业.forEach((classConfig) => {
        const button = $(
          `<div class="ui button" style="opacity:.45!important;cursor:auto;">？？？</div>`,
        );
        const html = /* html */ `
        <div class="ui large header">解锁条件</div> 
        ${_.map(classConfig.requirements, (expertise, className) =>
          labelHTML(className, `${expertise} 专精等级`, null, false),
        ).join('')}
          `;
        button.popup({
          inline: true,
          html,
          hoverable: true,
          delay: {
            show: 20,
            hide: 80,
          },
        });
        可转生职业.append(button);
      });
    }
  };

  // 设置确认转生模态框模板
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

  // 设置抽奖模态框模板
  $.fn.modal.settings.templates.抽奖三选一 =
    /**
     * @param {抽奖信息} 抽奖信息
     * @param {抽奖奖励[]} 抽奖奖励s
     */
    function f(抽奖信息, 抽奖奖励s) {
      let 奖励已领取 = false;
      const 给予奖励 = (抽奖奖励, successMsg) => {
        施加Buff(抽奖信息, 抽奖奖励);
        // 避免多次给予奖励
        if (奖励已领取) {
          return;
        }
        奖励已领取 = true;
        $.toast({
          displayTime: 2000,
          class: 'success chinese',
          showProgress: 'bottom',
          title: '领取奖励成功',
          message: successMsg,
        });
      };
      const 奖励按钮s = 抽奖奖励s.map((抽奖奖励) => {
        const { isFlatBuff } = 抽奖信息;
        const { statType, value } = 抽奖奖励;
        const rewardStr = `${statType} ${value >= 0 ? '+' : ''}${_.round(value, 2)}${
          isFlatBuff ? '' : '%'
        }`;
        return {
          text: rewardStr,
          抽奖奖励, // 保留对奖励信息的引用
          click: () => 给予奖励(抽奖奖励, `你获得了 ${rewardStr}`),
        };
      });
      return {
        title: `选择你的奖励`,
        closable: false,
        class: 'chinese',
        className: {
          modal: 'ui standard modal',
        },
        content: /* html */ `
        <div class="ui divided selection list">
          ${奖励按钮s
            .map((奖励按钮) => {
              const { base, baseMult, qualityMult } = 奖励按钮.抽奖奖励;
              const desc = `= ${_.round(base, 2)} X ${_.round(baseMult, 2)} X ${_.round(
                qualityMult,
                2,
              )}`;
              return /* html */ `
              <div class="item">
                <div class="content">
                  <div class="header">${奖励按钮.text} (${_.round(qualityMult * 100)}%)</div>
                  <div class="description">${desc}</div>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
        `,
        // 模态框显示时绑定事件
        onShow: () => {
          /** @type {JQuery<HTMLElement>} */
          const $modalElement = this.get.element();
          $modalElement.find('.content .item').each((index, e) => {
            $(e).on('click', () => {
              奖励按钮s[index].click();
              // 不是模态框的action按钮，需要手动关闭
              this.hide();
            });
          });
        },
        actions: [
          {
            text: '随机选择',
            class: 'grey',
            click: () => _.sample(奖励按钮s).click(),
          },
          {
            text: '重新抽取',
            class: 'teal',
            click: () => {
              const 新抽奖信息 = 获取抽奖信息(抽奖信息.useExpertise, 抽奖信息.isFlatBuff);
              if (!新抽奖信息.success) {
                $.toast({
                  title: '无法重新抽取',
                  class: 'error chinese',
                  displayTime: 2000,
                  showProgress: 'bottom',
                  message: 抽奖信息.useExpertise ? '专精等级不足。' : '金钱不足。',
                });
                return false;
              }
              扣除抽奖花费(新抽奖信息);
              $.toast({
                title: '已重新抽取奖品',
                class: 'grey chinese',
                displayTime: 2000,
                showProgress: 'bottom',
                message: `你失去了 ${新抽奖信息.cost} ${
                  新抽奖信息.useExpertise ? '专精等级' : '金钱'
                }。`,
              });
              // 开启新的抽奖并关闭当前模态框
              $.modal('抽奖三选一', 新抽奖信息, 试抽Buff(3, 新抽奖信息));
              return true;
            },
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
    format: Format.生命条格式,
  }).wrap($('<div class="column"></div>'));
  genProgressBar({
    id: '角色面板-魔法值进度条',
    parent: 角色面板进度条,
    color: 'blue',
    format: Format.魔法条格式,
  }).wrap($('<div class="column"></div>'));
  genProgressBar({
    id: '角色面板-经验值进度条',
    parent: 角色面板进度条,
    color: 'green',
    format: Format.经验条格式,
  }).wrap('<div class="column"></div>');

  // 区域面板
  区域界面.init();
  区域界面.refresh();

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
  // 生成刷怪计时进度条
  genProgressBar({
    id: '战斗面板-刷怪计时进度条',
    parent: $('#战斗面板-进度条容器'),
    color: 'grey',
    format: Format.刷怪计时进度条格式,
  }).wrap('<div class="column"></div>');
  // 生成必刷BOSS进度条
  genProgressBar({
    id: '战斗面板-必刷BOSS进度条',
    parent: $('#战斗面板-进度条容器'),
    color: 'yellow',
    format: Format.必刷BOSS进度条格式,
  }).wrap('<div class="column"></div>');
  // 创建玩家的战斗UI
  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  const player = 玩家管理器.getPlayer();
  战斗面板实体列表.append(genCombatLayout(player, { isPlayer: true }));

  // 背包面板
  $('#背包面板').on('contextmenu', (e) => {
    // 防止玩家右键丢东西的时候，不小心打开浏览器的右键菜单
    e.preventDefault();
  });
  genEquipments();
  player.背包.ui = new 背包界面(player.背包);

  // 商店面板
  // 初始化页面内容
  更新商店面板(player);
  // 注册抽奖按钮
  const 注册抽奖按钮 = (按钮id, useExpertise, isFlatBuff) => {
    checkNotNull({ 按钮id, useExpertise, isFlatBuff });
    const $按钮 = $(`#${按钮id}`);
    $按钮.on('click', () => {
      const 抽奖信息 = 获取抽奖信息(useExpertise, isFlatBuff);
      if (!抽奖信息.success) {
        $.toast({
          title: '抽奖失败',
          class: 'error chinese',
          displayTime: 2000,
          showProgress: 'bottom',
          message: useExpertise ? '专精等级不足。' : '金钱不足。',
        });
      } else {
        // 在选择奖励前就扣除花费，防止玩家刷新页面来免费重随
        扣除抽奖花费(抽奖信息);
        $.toast({
          title: '已抽取奖品',
          class: 'grey chinese',
          displayTime: 2000,
          showProgress: 'bottom',
          message: `你失去了 ${抽奖信息.cost} ${抽奖信息.useExpertise ? '专精等级' : '金钱'}。`,
        });
        // 抽取三个buff，让玩家选择一个
        const 抽奖奖励s = 试抽Buff(3, 抽奖信息);
        // 打开模态框，让玩家选择奖励
        $.modal('抽奖三选一', 抽奖信息, 抽奖奖励s);
      }
    });
  };
  注册抽奖按钮('商店面板-金钱抽奖-固定数值', false, true);
  注册抽奖按钮('商店面板-金钱抽奖-百分比', false, false);
  注册抽奖按钮('商店面板-专精抽奖-固定数值', true, true);
  注册抽奖按钮('商店面板-专精抽奖-百分比', true, false);

  // 设置面板
  // 初始化每个设置标题的内容
  templateFromElement($('#设置面板-游戏倍速标题'), { 游戏倍速: settings.游戏倍速 });
  templateFromElement($('#设置面板-更新频率标题'), {
    页面更新频率: _.round(1000 / settings.HTML更新间隔, 2),
  });
  // 初始化滑块
  $('#设置面板-游戏倍速滑块').slider({
    min: 0,
    max: 10,
    start: settings.游戏倍速,
    step: 0,
    onChange: (value) => {
      $.toast({
        message: `已设置游戏倍速为${value}`,
        displayTime: 1000,
        showProgress: 'bottom',
        class: 'success chinese',
      });
      templateFromElement($('#设置面板-游戏倍速标题'), { 游戏倍速: value });
      HTMLEvents.emit(EventType.更改设置, { setting: GameSettingName.游戏倍速, value });
    },
  });
  $('#设置面板-更新频率滑块').slider({
    min: 0,
    max: 60,
    start: 1000 / settings.HTML更新间隔,
    step: 0.1,
    restrictedLabels: _.range(0, 61, 5),
    onChange: (value) => {
      $.toast({
        message: `已设置页面更新频率为${value}`,
        displayTime: 1000,
        showProgress: 'bottom',
        class: 'success chinese',
      });
      templateFromElement($('#设置面板-更新频率标题'), { 页面更新频率: value });
      HTMLEvents.emit(EventType.更改设置, {
        setting: GameSettingName.HTML更新间隔,
        value: 1000 / value,
      });
    },
  });
  // 导出存档
  $('#设置面板-导出存档').on('click', () => {
    const 存档数据 = 玩家管理器.打包存档数据();
    if (!存档数据) {
      $.toast({
        title: '导出失败',
        message: '没有找到存档数据。',
        class: 'error chinese',
        displayTime: 2000,
        showProgress: 'bottom',
      });
    }
    const compressed = LZString.compressToUTF16(存档数据);
    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    // 创建一个指向该Blob的URL
    const url = URL.createObjectURL(blob);
    // 创建一个下载链接，指定下载文件名，模拟点击以触发下载
    const date = new Date();
    const 存档名称 = `巅峰神域-v${VERSION}-${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.txt`;
    $('<a></a>').attr('href', url).attr('download', 存档名称).get(0).click();
    // 清理创建的URL，以释放资源
    URL.revokeObjectURL(url);
    $.toast({
      title: '导出成功',
      message: '存档文件已经下载。',
      class: 'success chinese',
      displayTime: 2000,
      showProgress: 'bottom',
    });
  });
  // 导入存档
  $('#设置面板-导入存档').on('change', (event) => {
    // 获取到用户选中的文件
    const file = event.target.files[0];
    // 清空file input的值（缓存的文件路径，C:\\fakepath\\存档名称.txt），否则连续导入同一个文件不会触发change事件
    // 注意清空value会导致files为空，所以先获取file再清空value。
    event.target.value = '';
    if (!file) {
      console.warn('没有存档文件被选择.');
      return;
    }
    // 创建 FileReader 对象来读取这个文件
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result; // 文件内容的文本形式
      try {
        const decompressed = LZString.decompressFromUTF16(content);
        // 应用存档
        player.玩家存档.data = JSON.parse(decompressed);
        player.玩家存档.应用存档();
        $.toast({
          title: '导入成功',
          message: '存档文件已经导入。',
          class: 'success chinese',
          displayTime: 2000,
          showProgress: 'bottom',
        });
      } catch (error) {
        $.toast({
          title: '导入失败',
          message: '存档文件格式错误。',
          class: 'error chinese',
          displayTime: 2000,
          showProgress: 'bottom',
        });
      }
    };
    // 以文本形式读取文件
    reader.readAsText(file);
  });

  // 切换战斗面板外战斗信息toast的显示。
  const 设置面板战斗面板外战斗信息 = $('#设置面板-战斗面板外战斗信息');
  设置面板战斗面板外战斗信息[0].checked = settings.战斗面板外战斗信息;
  设置面板战斗面板外战斗信息.on('change', function f() {
    settings.战斗面板外战斗信息 = this.checked;
  });
  // 初始化popup
  设置面板战斗面板外战斗信息.popup({
    content: '在战斗面板外时，在右上角显示战斗信息。',
    inline: true,
    delay: {
      show: 20,
      hide: 80,
    },
  });

  // 生成技能栏
  new 技能栏界面($('#技能栏')).refresh();
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
    if (settings.HTML更新间隔 === Infinity) {
      console.log('欢迎回来！更新频率被设置为0，不恢复更新HTML。');
      return;
    }
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
    $('#战斗面板-区域名称').text(`${combatArea.name} +${combatArea.level}`);
    $('#战斗面板-区域描述').text(combatArea.description);
  });

  combatEvents.on(EventType.退出战斗区域, (_combatArea) => {
    $('#战斗面板-区域信息').hide();
  });

  generalEvents.on(EventType.穿上装备, ({ entity, equipment, updateUI = true }) => {
    if (entity !== 玩家管理器.getPlayer()) {
      return;
    }
    entity.背包.removeItem(equipment);
    // TODO: 更新指定装备栏。等装备栏布局完善后再实现，目前显示所有装备，并不理想。
    // 无脑刷新！太无脑了！
    if (updateUI) {
      genEquipments();
    }
  });

  generalEvents.on(EventType.脱下装备, ({ entity, equipment, updateUI = true, toIndex }) => {
    if (entity !== 玩家管理器.getPlayer()) {
      return;
    }
    entity.背包.addItem(equipment, 1, toIndex);
    // TODO: 更新指定装备栏。等装备栏布局完善后再实现，目前显示所有装备，并不理想。
    // 无脑刷新！太无脑了！
    if (updateUI) {
      genEquipments();
    }
  });

  // TODO：以后改成战斗信息区分治疗和伤害。
  HTMLEvents.on(
    EventType.渲染战斗信息,
    ({ damager, damaged, damages, healing, isBlocked, blockRate, isCrit, isDodged }) => {
      if (!isUpdatingHTML()) {
        return;
      }
      const playerInCombatTab = $('#战斗面板').hasClass('active');
      const player = 玩家管理器.getPlayer();
      const playerName = '<span class="ui large red text">你</span>';
      const damagerName = damager === player ? playerName : damager.职业.name;
      const damagedName = damaged === player ? playerName : damaged.职业.name;
      // 不用filter damage<=0，因为无效伤害没有传进来
      if (playerInCombatTab) {
        if (isDodged) {
          生成伤害信息({
            damaged,
            velocityScale: 1.5,
            gravityFactor: 1.8,
            offset: { x: 0, y: -0.3 },
            isDodged,
          });
        } else {
          _.forEach(damages, (damage, type) => {
            const roundedDamage = _.round(damage);
            // 伤害为0~0.5就不显示。
            if (roundedDamage <= 0) {
              return;
            }
            生成伤害信息({
              damaged,
              damage: roundedDamage,
              damageType: type,
              velocityScale: 1.5,
              gravityFactor: 1.8,
              offset: { x: 0, y: -0.3 },
              isBlocked,
              blockRate,
              isCrit,
              isDodged,
            });
          });
        }
      } else if (settings.战斗面板外战斗信息) {
        if (isDodged) {
          $.toast({
            message: `<span>${damagedName}闪避了${damagerName}的伤害。`,
            class: 'chinese',
            displayTime: 1000,
            showProgress: 'bottom',
          });
        } else {
          const damageMsg = _.chain(damages)
            .pickBy((damage) => damage > 0.5)
            .map((damage, type) => `${_.round(damage)}点${type}伤害`)
            .join('，');
          if (damageMsg !== '') {
            $.toast({
              // 战斗外信息不显示暴击和格挡，不然太长了。（真的不是我懒）
              message: `<span>${damagerName}</span>对${damagedName}造成了${damageMsg}。`,
              class: 'chinese',
              displayTime: 1000,
              showProgress: 'bottom',
            });
          }
        }
      }

      const roundedHealing = _.round(healing);
      // 需要检测，因为造成伤害不一定有治疗
      if (roundedHealing > 0) {
        if (playerInCombatTab) {
          生成治疗信息({
            healed: damager,
            healing: roundedHealing,
            velocityScale: 1.5,
            gravityFactor: 1.3,
            offset: { x: 0, y: -0.3 },
          });
        } else if (settings.战斗面板外战斗信息) {
          $.toast({
            message: `${damagerName}通过伤害${damagedName}恢复了${roundedHealing}点生命值。`,
            class: 'chinese',
            displayTime: 1000,
            showProgress: 'bottom',
          });
        }
      }
    },
  );
};

export {
  registerEvents,
  updateHTML,
  setupHTML,
  setHTMLInterval,
  clearHTMLInterval,
  isUpdatingHTML,
};
