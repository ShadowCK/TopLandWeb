import _ from 'lodash';
import * as 玩家管理器 from './player/玩家管理器.js';
import { getDecimalPrecision } from './utils.js';
import { StatType } from './combat/战斗属性.js';

const config = {
  生命条格式: '生命值: {value} / {total}',
  魔法条格式: '魔法值: {value} / {total}',
  经验条格式: '经验值: {value} / {total}',
  攻击条格式: '下次攻击: {value} / {total}',
  默认进度条格式: '{value} / {total}',
};

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

const progressBarHTML = ({ id, className = '', color = '', label = '', value = 0, maxValue = 1 }) =>
  `
  <div ${id ? `id="${id}"` : ''} class="ui ${color} progress active ${className}" data-percent="${
    (value / maxValue) * 100
  }">
    <div class="bar">
      <div class="progress"></div>
    </div>
    <div class="label">${label}</div>
  </div>
  `;

const genProgressBar = ({
  id,
  className = '',
  parent,
  color = '',
  label = '', // 默认标签。可忽略。只在被更新前（或更新时没有format）有用。
  value = 0,
  maxValue = 1,
  format,
}) => {
  const bar = $(progressBarHTML({ id, className, color, label, value, maxValue }));
  // 初始化进度条
  bar.progress(format ? { text: { active: format } } : {});
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
const genCombatLayout = (
  entity,
  parent,
  // TODO: 断言isEnemy=!isPlayer - 目前只有敌人，以后如果有召唤物/队友的话再进行修改
  { isPlayer = false, isEnemy = !isPlayer, config: entityConfig },
) => {
  console.log(isEnemy, entityConfig);
  const html = `
  <div id="${entity.uuid}" class="column">
    <div class="ui segment">
      ${`<h3 class="ui header">${isPlayer ? '你' : entity.职业.name}</h3>`}
      ${isEnemy && entityConfig.isBoss ? labelHTML('BOSS', '', 'yellow') : ''}
      ${isPlayer ? labelHTML('职业', entity.职业.name, 'teal') : ''}
      <div class="ui message">
        <p>${entity.职业.description}</p>
      </div>
      <div class="ui divider"></div>
      ${progressBarHTML({
        className: 'health-bar',
        color: 'red',
      })}
      ${progressBarHTML({
        className: 'mana-bar',
        color: 'blue',
      })}
      ${progressBarHTML({
        className: 'small attack-bar',
        color: 'grey',
      })}
    </div>
  </div>
  `;
  const element = $(html);
  // 初始化进度条
  updateProgressBar(
    element.find('.health-bar'),
    entity.生命值,
    entity.getStat2(StatType.最大生命值),
    config.生命条格式,
  );
  updateProgressBar(
    element.find('.mana-bar'),
    entity.魔法值,
    entity.getStat2(StatType.最大魔法值),
    config.魔法条格式,
  );
  updateProgressBar(
    element.find('.attack-bar'),
    entity.攻击计时器去掉攻速(),
    entity.实际攻击间隔(),
    config.攻击条格式,
  );
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
    // 如果是实体属性，不要用原始数值。显示buff加成后的数值
    // FIXME: 这里会浪费一些性能，因为已经有base了。getBuffedStat会更好。
    // TODO: 还有，要把getStat的clamp放到getBuffedStat里面，让getBuffStat也接受range参数。
    const valueToUse = isStat ? player.getStat2(path) : value;
    // 如果是实体属性，精确到成长的小数位数
    let precision;
    if (isStat) {
      const statGrowth = player.getStatGrowth(path);
      // 成长是0，精确到基础值的小数位数后一位（比如1.5精确到1.50，否则精确到成长值的小数位数
      precision = getDecimalPrecision(statGrowth[1] === 0 ? statGrowth[0] / 10 : statGrowth[1]);
    } else {
      precision = 2; // 默认精确到小数点后两位
    }
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
  config,
  changeTab,
  genLabel,
  genProgressBar,
  updateProgressBar,
  genElementForStats,
  genCombatLayout,
};
