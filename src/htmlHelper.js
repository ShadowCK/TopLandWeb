import _ from 'lodash';
import * as 玩家管理器 from './player/玩家管理器.js';
import { getDecimalPrecision } from './utils.js';

const changeTab = (tabPath) => {
  $.tab('change tab', tabPath);
  // 上面的函数不会更改tab的active状态，所以我们手动更改
  $(`a[data-tab="${tabPath}"]`).addClass('active');
  $(`a[data-tab="${tabPath}"]`).siblings().filter('[data-tab]').removeClass('active');
};

const labelHTML = (title, content, color = '') =>
  `
  <div>
    <div class="ui ${color} horizontal label">${title}</div>
    ${content || ''}
  </div>
  `;

const genLabel = (title, content, color = '') => {
  const label = $(labelHTML(title, content, color));
  return label;
};

const progressBarHTML = (id, color = '', label = '', value = 0, maxValue = 1) =>
  `
  <div ${id ? `id="${id}"` : ''} class="ui ${color} progress active" data-percent="${
    (value / maxValue) * 100
  }">
    <div class="bar">
      <div class="progress"></div>
    </div>
    <div class="label">${label}</div>
  </div>
  `;

const genProgressBar = (id, parent, color = '', label = '', value = 0, maxValue = 1) => {
  const bar = $(progressBarHTML(id, color, label, value, maxValue));
  // 初始化进度条
  bar.progress();
  parent.append(bar);
  return bar;
};

const updateProgressBar = (bar, value, maxValue, format = '{value} / {total}', precision = 0) => {
  const element = _.isString(bar) ? $(bar) : bar;
  element.progress({
    value: _.round(value, precision),
    total: _.round(maxValue, precision),
    text: {
      active: format,
    },
  });
};

/**
 * @param {import('./combat/实体.js').default} entity
 */
const genCombatLayout = (entity, parent, isPlayer = false) => {
  const html = `
  <div class="column">
    <div class="ui segment">
    ${`<h3 class="ui header">${isPlayer ? '你' : entity.职业.name}</h3>`}
    ${isPlayer ? labelHTML('职业', entity.职业.name, 'teal') : ''}
    <div class="ui message">
      <p>${entity.职业.description}</p>
    </div>
    <div class="ui divider"></div>
    ${progressBarHTML('', 'red', '生命值', entity.生命值, entity.getStat2('最大生命值'))}
    ${progressBarHTML('', 'blue', '魔法值', entity.魔法值, entity.getStat2('最大魔法值'))}
    </div>
  </div>
  `;
  const element = $(html);
  element.find('.progress').progress({
    text: {
      active: '{value} / {total}',
    },
  });
  $(parent).append(element);
};

/**
 * 虽然名字叫'ForStats'，允许传入不是战斗属性的数值。
 * 函数内部会检测'path'是否是玩家的属性。
 */
const genElementForStats = (parent, value, key, labelColor = '', path = [key]) => {
  if (_.isObject(value) && !Array.isArray(value)) {
    const label = $(`<div class="ui teal horizontal label">${key}</div>`);
    const child = $(`<div class="ui relax list"></div>`);
    parent.append(label, child);
    _.forEach(value, (v, k) => {
      genElementForStats(child, v, k, labelColor, [...path, k]);
    });
    return;
  }
  let formatted;
  // 属性成长是一个数组，且不受Buff影响
  // 这里我们断言数组是属性成长，否则是当前属性
  if (Array.isArray(value)) {
    formatted = value.map((v) => _.round(v, 2)).join('+');
  } else {
    const player = 玩家管理器.getPlayer();
    const isStat = _.get(player.stats, path) !== undefined;
    // 如果是玩家属性，不要用原始数值。显示buff加成后的数值
    // FIXME: 这里会浪费一些性能，因为已经有base了。getBuffedStat会更好。
    // TODO: 还有，要把getStat的clamp放到getBuffedStat里面，让getBuffStat也接受range参数。
    const valueToUse = isStat ? player.getStat2(path) : value;
    // 如果是玩家属性，精确到成长的小数位数
    const precision = isStat ? getDecimalPrecision(player.getStatGrowth(path)[1]) : 2;
    formatted = _.round(valueToUse, precision);
  }
  const html = `
    <div class="item">
      <div class="ui ${labelColor} horizontal label">${key}</div>${formatted}
    </div>
    `;
  parent.append(html);
};

export {
  changeTab,
  genLabel,
  genProgressBar,
  updateProgressBar,
  genElementForStats,
  genCombatLayout,
};
