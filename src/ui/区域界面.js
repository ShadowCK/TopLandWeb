import _ from 'lodash';
import { changeTab, genElementForStats, labelHTML } from '../htmlHelper.js';
import * as 战斗管理器 from '../combat/战斗管理器.js';
import 敌人 from '../combat/敌人.js';

/** @type {JQuery<HTMLElement>} */
let 区域面板;
/** @type {JQuery<HTMLElement>} */
let 区域列表;
/** @type {JQuery<HTMLElement>} */
let 区域信息;

const init = () => {
  区域面板 = $('#区域面板');
  区域列表 = 区域面板.find('#区域面板-区域列表');
  区域信息 = 区域面板.find('#区域面板-区域信息');
};

/**
 * @param {战斗区域} 战斗区域
 */
const genArea = (战斗区域) => {
  const areaTab = $(`<div class="ui tab" data-tab="区域-${战斗区域.name}"></div>`);
  // 为每个区域生成介绍和前往按钮
  $(`
    <div class="ui message">
      <p>${战斗区域.description}</p>
    </div>
    `).appendTo(areaTab);
  $(`
    <button class="ui right labeled icon button">
      <i class="right arrow icon"></i>
      前往
    </button>`)
    .on('click', () => {
      changeTab('战斗面板');
      战斗管理器.切换战斗区域(战斗区域);
    })
    .appendTo(areaTab);
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
  _.forEach(战斗管理器.所有战斗区域, (战斗区域) => {
    // 为每个区域生成一个按钮
    const 区域按钮 = $(`<a class="item" data-tab="区域-${战斗区域.name}">${战斗区域.name}</a>`);
    区域列表.append(区域按钮);
    // 生成区域按钮对应的分页
    const areaTab = genArea(战斗区域);
    区域信息.append(areaTab);
    areaTab.find('a.item').tab();
  });
  区域列表.find('a.item').tab();
};

export { init, refresh };
