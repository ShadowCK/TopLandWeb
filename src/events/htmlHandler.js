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
  genInventory,
  genEquipments,
  loadAndRenderMarkdown,
  isItemInPage,
} from '../htmlHelper.js';
import * as 玩家管理器 from '../player/玩家管理器.js';
import * as 战斗管理器 from '../combat/战斗管理器.js';
import classConfigs from '../classes/职业信息.js';
import { generalEvents, combatEvents, EventType, HTMLEvents } from './事件管理器.js';
import { get最高专精等级经验倍率, settings } from '../settings.js';
import { StatType } from '../combat/战斗属性.js';
import { templateFromElement, getMaxLevel } from '../utils.js';
import { 可以提升专精等级, 可以转生, 转生 } from '../reincarnate/转生.js';
import { addToWindow } from '../debug.js';
import { GameSettingName } from '../enums.js';
import { update as 更新战斗信息, 生成伤害信息, 生成治疗信息 } from '../战斗信息管理器.js';

let lastUpdate = performance.now();
let htmlWorkerId = null;

const isUpdatingHTML = () => htmlWorkerId != null;

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

  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  // 即使不在战斗，也更新玩家的生命条等信息。
  updateCombatLayout(getCombatLayout(战斗面板实体列表, player), player, { isPlayer: true });
  const enemies = 战斗管理器.getEnemiesInCombat();
  enemies.forEach((enemy) =>
    updateCombatLayout(getCombatLayout(战斗面板实体列表, enemy), enemy, { isEnemy: true }),
  );

  更新战斗信息(dt);
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
  const 区域面板 = $('#区域面板');
  _.forEach(战斗管理器.所有战斗区域, (战斗区域) => {
    const 敌人信息 = Object.values(战斗区域.enemies)
      .map((areaEnemyConfig) => {
        const enemyConfig = areaEnemyConfig.config;
        const label = areaEnemyConfig.isBoss ? labelHTML('BOSS', '', 'yellow', true) : '';
        const dropsString =
          enemyConfig.掉落.length > 0
            ? enemyConfig.掉落
                .map((drop) => `${drop.chance}%${drop.config.name}X${drop.count}`)
                .join('，')
            : '无';
        return `
        <div class="column">
          <div class="ui segment">
          <div>${enemyConfig.职业.name}${label}</div>
            <div>金钱: ${enemyConfig.金钱}</div>
            <div>经验值: ${enemyConfig.经验值}</div>
            <div>掉落: ${dropsString}</div>
          </div>
        </div>
      `;
      })
      .join('');
    const element = $(`
      <div class="ui segment">
        <div class="ui medium header">
          ${战斗区域.name}
          <div class="sub header">${战斗区域.description}</div>
        </div>
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
  战斗面板实体列表.append(genCombatLayout(player, { isPlayer: true }));

  // 背包面板
  $('#背包面板').on('contextmenu', (e) => {
    // 防止玩家右键丢东西的时候，不小心打开浏览器的右键菜单
    e.preventDefault();
  });
  genEquipments();
  genInventory();

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
    start: 1,
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
    const 存档名称 = `巅峰神域-v${VERSION}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.txt`;
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
    $('#战斗面板-区域名称').text(combatArea.name);
    $('#战斗面板-区域描述').text(combatArea.description);
  });

  combatEvents.on(EventType.退出战斗区域, (_combatArea) => {
    $('#战斗面板-区域信息').hide();
  });

  generalEvents.on(EventType.获得物品, ({ index, startIndex, endIndex, prevLength }) => {
    const 选择背包分页 = $('#背包面板-选择背包分页');
    const activePageIndex = 选择背包分页.attr('data-active-page-index');
    // 如果获得物品在当前页，刷新背包物品
    if (isItemInPage(选择背包分页, index, startIndex, endIndex)) {
      console.log('当前页面获得物品，刷新背包物品');
      genInventory(activePageIndex, false, true);
    }
    // 如果获得物品后总页数增加，刷新背包分页
    const player = 玩家管理器.getPlayer();
    const itemsPerPage = 选择背包分页.attr('data-items-per-page');
    const previousTotalPages = Math.ceil(prevLength / itemsPerPage);
    const totalPages = Math.ceil(player.背包.items.length / itemsPerPage);
    if (totalPages > previousTotalPages) {
      console.log('最大页数增加，刷新背包分页');
      genInventory(activePageIndex, true, false);
    }
  });

  generalEvents.on(EventType.失去物品, ({ index, prevLength }) => {
    const 选择背包分页 = $('#背包面板-选择背包分页');
    const activePageIndex = 选择背包分页.attr('data-active-page-index');

    const player = 玩家管理器.getPlayer();
    const itemsPerPage = 选择背包分页.attr('data-items-per-page');
    const activePageStart = (activePageIndex - 1) * itemsPerPage;
    const previousTotalPages = Math.ceil(prevLength / itemsPerPage);
    const totalPages = Math.ceil(player.背包.items.length / itemsPerPage);
    // 如果失去物品后总页数减少，刷新背包分页。
    if (totalPages < previousTotalPages) {
      console.log('最大页数减少，刷新背包分页');
      genInventory(activePageIndex, true, false);
    }
    // 如果失去物品在当前页，刷新背包物品
    if (isItemInPage(选择背包分页, index)) {
      // 如果当前页（最后一页）没有物品了，刷新背包物品到上一页
      if (activePageStart > player.背包.items.length - 1) {
        console.log('当前页面失去物品，且没有剩余物品，刷新背包物品到上一页');
        genInventory(activePageIndex - 1, false, true);
        return;
      }
      console.log('当前页面失去物品，刷新背包物品');
      genInventory(activePageIndex, false, true);
    }
  });

  generalEvents.on(EventType.穿上装备, ({ entity, _equipment }) => {
    if (entity !== 玩家管理器.getPlayer()) {
      return;
    }
    // TODO: 更新指定装备栏。等装备栏布局完善后再实现，目前显示所有装备，并不理想。
    // 无脑刷新！太无脑了！
    genEquipments();
  });

  generalEvents.on(EventType.脱下装备, ({ entity, _equipment }) => {
    if (entity !== 玩家管理器.getPlayer()) {
      return;
    }
    // TODO: 更新指定装备栏。等装备栏布局完善后再实现，目前显示所有装备，并不理想。
    // 无脑刷新！太无脑了！
    genEquipments();
  });

  // TODO：以后改成战斗信息区分治疗和伤害。
  HTMLEvents.on(EventType.渲染战斗信息, ({ damager, damaged, damages, healing }) => {
    if (!isUpdatingHTML()) {
      return;
    }
    const playerInCombatTab = $('#战斗面板').hasClass('active');
    const player = 玩家管理器.getPlayer();
    const playerName = '<span class="ui large red text">你</span>';
    const damagername = damager === player ? playerName : damager.职业.name;
    const damagedname = damaged === player ? playerName : damaged.职业.name;
    // 不用filter damage<=0，因为无效伤害没有传进来
    // TODO：这个popup的信息会包括伤害0~0.5的伤害，但是round为0的伤害没必要显示。
    // 下面的伤害信息就round了。记得改一下，_.pickBy（不能filter因为返回的是数组）一下再_.map
    const damageMsg = _.map(damages, (damage, type) => `${_.round(damage)}点${type}伤害`).join(
      '，',
    );
    if (damageMsg !== '') {
      if (playerInCombatTab) {
        _.forEach(damages, (damage, type) => {
          const roundedDamage = _.round(damage);
          if (roundedDamage > 0) {
            生成伤害信息({
              damaged,
              damage: roundedDamage,
              damageType: type,
              velocityScale: 1.5,
              gravityFactor: 1,
              offset: { x: 0, y: -0.3 },
            });
          }
        });
      } else {
        $.toast({
          message: `<span>${damagername}</span>对${damagedname}造成了${damageMsg}。`,
          class: 'chinese',
          displayTime: 1000,
          showProgress: 'bottom',
        });
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
          gravityFactor: 1,
          offset: { x: 0, y: -0.3 },
        });
      } else {
        $.toast({
          message: `${damagername}通过伤害${damagedname}恢复了${roundedHealing}点生命值。`,
          class: 'chinese',
          displayTime: 1000,
          showProgress: 'bottom',
        });
      }
    }
  });
};

export {
  registerEvents,
  updateHTML,
  setupHTML,
  setHTMLInterval,
  clearHTMLInterval,
  isUpdatingHTML,
};
