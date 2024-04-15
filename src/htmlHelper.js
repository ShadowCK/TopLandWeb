import _ from 'lodash';
import * as 玩家管理器 from './player/玩家管理器.js';

const genLabel = (title, content, color = '') => {
  const label = $(`
  <div>
    <div class="ui ${color} horizontal label">${title}</div>
    ${content || ''}
  </div>
  `);
  return label;
};

const genProgressBar = (id, parent, color = '', label = '', value = 0, maxValue = 1) => {
  const html = `
  <div id="${id}" class="ui ${color} progress active" data-percent="${(value / maxValue) * 100}">
    <div class="bar">
      <div class="progress"></div>
    </div>
    <div class="label">${label}</div>
  </div>`;
  const bar = $(html);
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
    formatted = _.round(isStat ? player.getStat2(path) : value, 0);
  }
  const html = `
    <div class="item">
      <div class="ui ${labelColor} horizontal label">${key}</div>${formatted}
    </div>
    `;
  parent.append(html);
};

export { genLabel, genProgressBar, updateProgressBar, genElementForStats };
