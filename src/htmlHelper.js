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

// Generated by ChatGPT as I'm not a regex expert
const compressHTML = (htmlString) =>
  htmlString
    .replace(/>\s+|\s+</g, (m) => m.trim()) // Remove spaces around tags
    .replace(/(\r\n|\n|\r)\s*/gm, '') // Remove all newlines and spaces starting a newline
    .trim();

const changeTab = (tabPath) => {
  $.tab('change tab', tabPath);
  // 上面的函数不会更改tab的active状态，所以我们手动更改
  $(`a[data-tab="${tabPath}"]`).addClass('active');
  $(`a[data-tab="${tabPath}"]`).siblings().filter('[data-tab]').removeClass('active');
};

const labelHTML = (title, content, className = '') =>
  `
  <div class="ui ${className} horizontal label">${title}</div>
  ${content != null ? content : ''}
  `;

const genLabel = (title, content, className = '') => {
  const label = $(labelHTML(title, content, className));
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
  const roundedValue = _.round(value, precision);
  const roundedTotal = _.round(maxValue, precision);
  const percent = (roundedValue / roundedTotal) * 100;
  // 手动替换，不然的话fomantic-ui显示的value是roundedTotal * percent，再round到精度（这里默认精度0，就是round到整数）
  // 只能传入value和total，或total和percent，另外一个值fomantic-ui会自动计算。我们不希望用他自动计算的，因为他自己的精度
  // 会同时影响百分比和value的显示。
  let active = format.replace(/{value}/g, roundedValue);
  if (roundedTotal === Infinity) {
    active = active.replace(/{total}/g, '∞');
  }
  element.progress({
    total: roundedTotal,
    percent: percent >= 99.5 && percent < 100 ? 99.49 : percent,
    text: {
      active,
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
    2,
  );
  $(parent).append(element);
};

/**
 * 虽然名字叫'ForStats'，允许传入不是战斗属性的数值。
 * 函数内部会检测'path'是否是实体的属性。
 */
const genElementForStats = (entity, parent, value, key, labelClass = '', path = [key]) => {
  if (_.isObject(value) && !Array.isArray(value)) {
    const label = $(`<div class="ui teal horizontal label">${key}</div>`);
    const child = $(`<div class="ui list"></div>`);
    parent.append(label, child);
    _.forEach(value, (v, k) => {
      genElementForStats(entity, child, v, k, labelClass, [...path, k]);
    });
    return;
  }
  let formatted;
  // 属性成长是一个数组，且不受Buff影响
  // 这里我们断言数组是属性成长，否则是当前属性
  if (Array.isArray(value)) {
    formatted = value.map((v) => _.round(v, 2)).join('+');
  } else {
    const isStat = _.get(entity.stats, path) !== undefined;
    // 如果是实体属性，不要用原始数值。显示buff加成后的数值
    // FIXME: 这里会浪费一些性能，因为已经有base了。getBuffedStat会更好。
    // TODO: 还有，要把getStat的clamp放到getBuffedStat里面，让getBuffStat也接受range参数。
    const valueToUse = isStat ? entity.getStat2(path) : value;
    // 如果是实体属性，精确到成长的小数位数
    let precision;
    if (isStat) {
      const statGrowth = entity.getStatGrowth(path);
      // 成长是0，精确到基础值的小数位数后一位（比如1.5精确到1.50，否则精确到成长值的小数位数
      precision = getDecimalPrecision(statGrowth[1] === 0 ? statGrowth[0] / 10 : statGrowth[1]);
    } else {
      precision = 2; // 默认精确到小数点后两位
    }
    formatted = _.round(valueToUse, precision);
  }
  const html = `
    <div class="item">
      ${labelHTML(key, formatted, labelClass)}
    </div>
    `;
  parent.append(html);
};

const genElementForEquipmentStat = (parent, value, key, labelClass = '', path = [key]) => {
  if (_.isObject(value) && _.isEmpty(value)) {
    return;
  }
  if (_.isObject(value) && !Array.isArray(value)) {
    const label = $(labelHTML(key, '', `teal ${labelClass}`));
    const child = $(`<div class="ui tiny segment"><div class="ui list"></div></div>`);
    parent.append($('<div class="column"></div>').append(label, child));
    _.forEach(value, (v, k) => {
      genElementForEquipmentStat(child, v, k, labelClass, [...path, k]);
    });
    return;
  }
  if (value === 0) {
    return;
  }
  let formatted;
  if (Array.isArray(value)) {
    formatted = value.map((v) => _.round(v, 2)).join('+');
  } else {
    formatted = _.round(value, 2);
  }
  const html =
    path.length > 1
      ? `<div class="item">
          ${labelHTML(key, formatted, labelClass)}
         </div>
         `
      : `<div class="column">
           <div class="item">
             ${labelHTML(key, formatted, labelClass)}
           </div>
         </div>
         `;
  parent.append(html);
};

const genItemHTML = () =>
  `
  <div class="column">
    <div class="ui card">
      <div class="content">
        <div class="ui placeholder">
          <div class="square image">
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

const genItem = (item, parent) => {
  const tempParent = $(`
  <div>
    <h3 class="ui header">${item.name}</h3>
    <div class="ui message">
      <p>${item.description}</p>
    </div>
    <div class="ui relaxed four column grid">
    </div>
  </div>
  `);
  const grid = tempParent.find('.ui.grid');
  _.forEach(item.stats, (value, key) => {
    genElementForEquipmentStat(grid, value, key, 'small');
  });
  const element = $(genItemHTML());
  element.attr('data-variation', 'multiline flowing');
  element.attr('data-html', compressHTML(tempParent.html()));
  element.popup({
    delay: {
      show: 30,
      hide: 100,
    },
    // inline可以apply local CSS rules，让它看起来更对，但是不会在关闭时自动移除
    // TODO: 在父元素被删除时移除popup
    inline: true,
    lastResort: true,
  });
  $(parent).append(element);
};

export {
  config,
  changeTab,
  genLabel,
  genProgressBar,
  updateProgressBar,
  genElementForStats,
  genCombatLayout,
  genItem,
};
