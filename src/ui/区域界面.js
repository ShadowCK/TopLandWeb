import _ from 'lodash';
import { changeTab, genElementForStats, labelHTML, labelHTML2 } from '../htmlHelper.js';
import * as 战斗管理器 from '../combat/战斗管理器.js';
import 敌人 from '../combat/敌人.js';
import {
  获取点击倍率,
  计算区域难度奖励倍率,
  计算区域难度属性倍率,
  计算装备品阶属性倍率,
} from '../settings.js';
import { EventType, HTMLEvents } from '../events/事件管理器.js';

/** @type {JQuery<HTMLElement>} */
let 区域面板;
/** @type {JQuery<HTMLElement>} */
let 区域列表;
/** @type {JQuery<HTMLElement>} */
let 区域信息;

/**
 * @param {JQuery<HTMLElement>} areaButton
 * @param {JQuery<HTMLElement>} areaTab
 * @param {战斗区域} 战斗区域
 */
const 更新区域等级显示 = (areaButton, areaTab, 战斗区域) => {
  const 区域按钮 = areaButton == null ? $(`#区域按钮-${战斗区域.name}`) : areaButton;
  const 区域分页 = areaTab == null ? $(`#区域分页-${战斗区域.name}`) : areaTab;
  const 区域详情 = 区域分页.find('.区域详情');
  区域详情.empty();
  区域详情.append(/* html */ `
    <div class="ui horizontal list">
      ${labelHTML2({
        title: '区域等级',
        detail: `${战斗区域.level}/${战斗区域.maxLevel}`,
      })}
      ${labelHTML2({
        title: '区域最大等级上限',
        detail: 战斗区域.levelCap,
      })}
      ${labelHTML2({
        title: '敌人属性倍率',
        detail: _.round(计算区域难度属性倍率(战斗区域.level), 2),
      })}
      ${labelHTML2({
        title: '金经奖励倍率',
        detail: _.round(计算区域难度奖励倍率(战斗区域.level), 2),
      })}
      ${labelHTML2({
        title: '装备属性倍率',
        detail: _.round(计算装备品阶属性倍率(战斗区域.level), 2),
      })}
      ${labelHTML2({ title: '刷怪间隔', detail: 战斗区域.刷怪间隔 })}
      ${labelHTML2({ title: '最大敌人数', detail: 战斗区域.最大敌人数 })}
      ${labelHTML2({
        title: '必刷BOSS刷怪数量',
        detail: 战斗区域.必刷BOSS刷怪数量,
        className: 'black',
      })}
    </div>
  `);
  区域按钮.text(`${战斗区域.name} +${战斗区域.level}`);
};

/**
 * @param {JQuery<HTMLElement>} 区域按钮
 * @param {战斗区域} 战斗区域
 */
const genArea = (区域按钮, 战斗区域) => {
  const areaTab = $(
    `<div id="区域分页-${战斗区域.name}" class="ui tab" data-tab="区域-${战斗区域.name}"></div>`,
  );
  // 为每个区域生成介绍和前往按钮
  $(`
    <div class="ui message">
      <h3 class="ui header">${战斗区域.name}</h3>
      <p>${战斗区域.description}</p>
      <div class="区域详情"></div>
    </div>
    `).appendTo(areaTab);
  更新区域等级显示(区域按钮, areaTab, 战斗区域);
  const buttons = $(/* html */ `
    <div class="ui spaced buttons">
      <button class="ui right labeled icon button" data-use="前往战斗区域">
        <i class="right arrow icon"></i>
        前往
      </button>
      <button class="ui right labeled icon button" data-use="提升区域等级">
        <i class="angle double up icon"></i>
        提升区域等级
      </button>
      <button class="ui right labeled icon button" data-use="降低区域等级">
        <i class="angle double down icon"></i>
        降低区域等级
      </button>
    </div>
    `).appendTo(areaTab);
  buttons.find('[data-use="前往战斗区域"]').on('click', () => {
    战斗管理器.切换战斗区域(战斗区域);
    changeTab('战斗面板');
  });
  buttons.find('[data-use="提升区域等级"]').on('click', (e) => {
    const added = 获取点击倍率(e, 1);
    if (战斗区域.addLevel(added)) {
      更新区域等级显示(区域按钮, areaTab, 战斗区域);
    } else {
      const message =
        战斗区域.maxLevel < 战斗区域.levelCap
          ? `当前等级已达最大等级（${战斗区域.maxLevel}）`
          : '当前等级已达最大等级上限';
      $.toast({
        title: '无法提升区域等级',
        message,
        displayTime: 2000,
        showProgress: 'bottom',
        class: 'warning chinese',
      });
    }
  });
  buttons.find('[data-use="降低区域等级"]').on('click', (e) => {
    const subtracted = 获取点击倍率(e, -1);
    if (战斗区域.addLevel(subtracted)) {
      更新区域等级显示(区域按钮, areaTab, 战斗区域);
    }
  });
  const tabular = $('<div class="ui top attached tabular pointing secondary menu"></div>').appendTo(
    areaTab,
  );
  const info = $('<div class="ui bottom attached segment"></div>').appendTo(areaTab);
  _.forEach(战斗区域.enemies, (areaEnemyConfig) => {
    const enemyConfig = areaEnemyConfig.config;
    const label = areaEnemyConfig.isBoss ? labelHTML('BOSS', '', 'yellow', true) : '';
    const 信息按钮 = $(
      `<a class="item" data-tab="敌人-${enemyConfig.职业.name}">${enemyConfig.职业.name}${label}</a>`,
    );
    tabular.append(信息按钮);
    const dropsString =
      enemyConfig.掉落.length > 0
        ? enemyConfig.掉落
            .map((drop) => `${drop.chance}%${drop.config.name}X${drop.count}`)
            .join('，')
        : '无';
    const enemyTab = $(/* html */ `
      <div class="ui tab" data-tab="敌人-${enemyConfig.职业.name}">
        <div class="ui list">
          <div class="item">${labelHTML('金钱', enemyConfig.金钱, 'black')}</div>
          <div class="item">${labelHTML('经验值', enemyConfig.经验值, 'black')}</div>
          <div class="item">${labelHTML('掉落', dropsString, 'black')}</div>
        </div>
      </div>
    `);
    const tempEnemy = new 敌人(enemyConfig);
    const statsList = enemyTab.find('.ui.list');
    _.forEach(tempEnemy.stats, (value, key) => {
      genElementForStats(tempEnemy, statsList, value, key);
    });
    info.append(enemyTab);
  });
  return areaTab;
};

const refresh = () => {
  区域列表.empty();
  区域信息.empty();
  _.forEach(战斗管理器.所有战斗区域, (战斗区域) => {
    // 为每个区域生成一个按钮
    const 区域按钮 = $(
      `<a class="item" id="区域按钮-${战斗区域.name}" data-tab="区域-${战斗区域.name}">${战斗区域.name}</a>`,
    );
    区域列表.append(区域按钮);
    // 生成区域按钮对应的分页
    const areaTab = genArea(区域按钮, 战斗区域);
    区域信息.append(areaTab);
    areaTab.find('a.item').tab();
  });
  区域列表.find('a.item').tab();
};

const init = () => {
  区域面板 = $('#区域面板');
  区域列表 = 区域面板.find('#区域面板-区域列表');
  区域信息 = 区域面板.find('#区域面板-区域信息');

  HTMLEvents.on(EventType.区域最大等级提升, (战斗区域) => {
    更新区域等级显示(null, null, 战斗区域);
    $.toast({
      title: '你击败了区域BOSS！',
      message: `${战斗区域.name}的最大等级提升至${战斗区域.maxLevel}`,
      displayTime: 5000,
      showProgress: 'bottom',
      class: 'black chinese',
    });
  });
};

export { init, refresh };
