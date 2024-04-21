import _ from 'lodash';
import showdown from 'showdown';

import * as 玩家管理器 from './player/玩家管理器.js';
import { getDecimalPrecision } from './utils.js';
import { StatType } from './combat/战斗属性.js';
import 装备 from './items/装备.js';
import { settings as gameSettings } from './settings.js';

const config = {
  生命条格式: '生命值: {value} / {total}',
  魔法条格式: '魔法值: {value} / {total}',
  经验条格式: '经验值: {value} / {total}',
  攻击条格式: '下次攻击: {value} / {total}',
  默认进度条格式: '{value} / {total}',
};

const githubMarkdownCSS = fetch(
  'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css',
)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load CSS due to response error: Status ${response.status}`);
    }
    return response.text();
  })
  .catch((error) => new Error(`Error while fetching GitHub Markdown CSS ${error.message}`));
/**
 * 使用了Shadow DOM，所以外部的CSS不会影响到内部，反之亦然。
 * @param {string} url
 * @param {JQuery<HTMLElement>} parent
 */
const loadAndRenderMarkdown = async (url, parent) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const markdown = await response.text();
    const converter = new showdown.Converter();
    const html = converter.makeHtml(markdown);

    const parentElement = parent[0];
    const shadowRoot = parentElement.attachShadow({ mode: 'open' });
    const css = await githubMarkdownCSS;
    if (css instanceof Error) {
      throw css;
    }
    const style = document.createElement('style');
    style.textContent = css;
    const div = document.createElement('div');
    div.className = 'markdown-body'; // Assume GitHub CSS expects this class
    div.innerHTML = html;
    shadowRoot.append(style, div);
  } catch (error) {
    console.error('Failed to generate markdown', error);
    parent.html(`<p>生成markdown文件失败。</p>`);
  }
};

const wrapHtml = (htmlString, tags) => {
  // 单个标签
  if (_.isString(tags)) {
    return `<${tags}>${htmlString}</${tags}>`;
  }
  let result = htmlString;
  // 从最内层标签开始包裹
  for (let i = tags.length - 1; i >= 0; i--) {
    if (_.isString(tags[i])) {
      result = `<${tags[i]}>${result}</${tags[i]}>`;
    } else {
      const { name, settings } = tags[i];
      result = `<${name} ${settings}}>${result}</${name}>`;
    }
  }
  return result;
};

// Clean up HTML string
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

const labelHTML = (title, content, className = '', inline = false) => {
  const settings = `class="ui ${className} horizontal label"`;
  return /* html */ `
    ${wrapHtml(title, [{ name: inline ? 'span' : 'div', settings }])}
    ${content != null ? content : ''}
    `;
};

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
  let percent = (value / maxValue) * 100;
  // 边缘情况： 0/0 或 Infinity/Infinity显示100%
  if (value === maxValue && (value === 0 || value === Infinity)) {
    percent = 100;
  }
  // 其他边缘情况：-Infinity/Infinity，或者value，maxValue不是数字
  else if (Number.isNaN(value / maxValue)) {
    percent = 0;
  } else {
    // 为了保证UI刷新，在超过fomantic-ui的精度阈值时设置为恰好低于阈值。
    percent = percent >= 99.5 && percent < 100 ? 99.49 : percent;
  }
  // fomantic-ui自带的精度只影响百分比显示，显示value精度是固定的，total却又保留原数值（不round），很混乱。
  // 这里直接将value和total都round，然后替换format中的{value}和{total}。
  const active = format
    .replace(/{value}/g, value === Infinity ? '∞' : _.round(value, precision))
    .replace(/{total}/g, maxValue === Infinity ? '∞' : _.round(maxValue, precision));
  element.progress({
    total: maxValue,
    percent,
    text: {
      active,
    },
  });
};

const getCombatLayout = (parent, entity) => parent.find(`#${entity.uuid}`);

/**
 * @param {import('./combat/实体.js').default} entity
 */
const updateCombatLayout = (combatLayout, entity, { isPlayer = false, isEnemy = !isPlayer }) => {
  combatLayout.find('.ui.header').text(isPlayer ? '你' : entity.职业.name);
  combatLayout
    .find('.标签s')
    .html(
      `${isEnemy && entity.isBoss ? labelHTML('BOSS', '', 'yellow') : ''}${
        isPlayer ? labelHTML('职业', entity.职业.name, 'teal') : ''
      }`,
    );
  combatLayout.find('.ui.message').html(`<p>${entity.职业.description}</p>`);

  updateProgressBar(
    combatLayout.find('.health-bar'),
    entity.生命值,
    entity.getStat2(StatType.最大生命值),
    '生命值: {value} / {total}',
  );
  updateProgressBar(
    combatLayout.find('.mana-bar'),
    entity.魔法值,
    entity.getStat2(StatType.最大魔法值),
    '魔法值: {value} / {total}',
  );
  updateProgressBar(
    combatLayout.find('.attack-bar'),
    entity.攻击计时器去掉攻速(),
    entity.实际攻击间隔(),
    config.攻击条格式,
    2,
  );
};

/**
 * @param {import('./combat/实体.js').default} entity
 */
const genCombatLayout = (
  entity,
  // TODO: 断言isEnemy=!isPlayer - 目前只有敌人，以后如果有召唤物/队友的话再进行修改
  // TODO: 断言isEnemy时entityConfig不为空
  { isPlayer = false, isEnemy = false } = {},
) => {
  const html = /* html */ `
  <div id="${entity.uuid}" class="column">
    <div class="ui segment">
      ${`<h3 class="ui header">${isPlayer ? '你' : entity.职业.name}</h3>`}
      <div class="标签s">
        ${isEnemy && entity.isBoss ? labelHTML('BOSS', '', 'yellow') : ''}
        ${isPlayer ? labelHTML('职业', entity.职业.name, 'teal') : ''}
      </div>
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
  updateCombatLayout(element, entity, { isPlayer, isEnemy });
  return element;
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
    const list = $(`<div class="ui relaxed divided horizontal list"></div>`);
    parent.append(
      $('<div class="ui center aligned segment" style="border:none;"></div>').append(label, list),
    );
    _.forEach(value, (v, k) => {
      genElementForEquipmentStat(list, v, k, labelClass, [...path, k]);
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
  // Leaf
  const html =
    path.length > 1
      ? `<div class="item">
          ${labelHTML(key, formatted, labelClass)}
         </div>
         `
      : `<div class="ui center aligned segment" style="border:none;">
          ${labelHTML(key, formatted, labelClass)}
         </div>
         `;
  parent.append(html);
};

const genItemHTML = () =>
  `
  <div class="column">
    <div class="ui card">
      <div class="ui image placeholder" style="animation:none;">
        <div class="square icon image">
        </div>
      </div>
    </div>
  </div>
  `;

const genItem = (item, parent) => {
  const isEquipment = item instanceof 装备;
  const element = $(genItemHTML());
  if (isEquipment) {
    element.css('cursor', 'pointer');
    element.on('click', () => {
      const player = 玩家管理器.getPlayer();
      if (player.拥有装备(item)) {
        item.脱下(player);
      } else {
        item.穿上(player);
      }
    });
  }
  // popup content
  const tempParent = $(`
    <div>
      <h3 class="ui header">${item.name}</h3>
      <div class="ui message">
        <p>${item.description}</p>
      </div>
      <div class="ui horizontal wrapping segments"></div>
      <div class="ui divider"></div>
      <button class="ui button" data-use="丢弃">丢弃</button>
    </div>
    `);
  const grid = tempParent.find('.ui.segments');
  _.forEach(item.stats, (value, key) => {
    genElementForEquipmentStat(grid, value, key, 'small');
  });
  element.attr('data-variation', 'multiline flowing');
  element.attr('data-html', compressHTML(tempParent.html()));
  element.popup({
    hoverable: true,
    delay: {
      show: 30,
      hide: 100,
    },
    onCreate: function onCreate() {
      this.find('.button[data-use="丢弃"]').on('click', () => {
        玩家管理器.getPlayer().dropItem(item);
        $.toast({
          message: `你丢掉了${item.name}。`,
        });
      });
    },
    // inline可以apply local CSS rules，让它看起来更对，但是不会在关闭时自动移除
    // TODO: 在父元素被删除时移除popup
    inline: true,
    lastResort: true,
  });
  // 右键也可以丢弃物品
  element.on('contextmenu', (e) => {
    e.preventDefault();
    const player = 玩家管理器.getPlayer();
    if (isEquipment && player.拥有装备(item)) {
      $.toast({
        title: '危险！',
        class: 'red',
        message: `我禁止了右键丢弃已经穿戴的装备，防止误操作。`,
      });
      return;
    }
    player.dropItem(item);
    $.toast({
      message: `你丢掉了${item.name}。`,
    });
  });
  $(parent).append(element);
};

const paginationHTML = (totalPages, maxPages, activePageIndex = 1) => {
  const pageButtonHTML = (index) =>
    activePageIndex === index
      ? `<a class="item active" data-index="${index}">${index}</a>`
      : `<a class="item" data-index="${index}">${index}</a>`;

  // 如果总页数小于最大页数，直接显示所有页数
  if (totalPages < maxPages) {
    return {
      html: _.range(1, totalPages + 1)
        .map((index) => pageButtonHTML(index))
        .join(''),
      startPageIndex: 1,
      endPageIndex: totalPages + 1,
      totalPages,
    };
  }
  // 总页数大于最大页数，显示省略号和前后按钮
  let html = '';
  const prevButton = `<a class="item prev-button"><i class="chevron left icon"></i></a>`;
  const nextButton = `<a class="item next-button"><i class="chevron right icon"></i></a>`;
  const ellipsis = `<div class="disabled item">...</div>`;
  const pagesBeforeActive = Math.floor((maxPages - 1) / 2);
  const pagesAfterActive = maxPages - 1 - pagesBeforeActive;
  let startPageIndex = Math.max(1, activePageIndex - pagesBeforeActive);
  let endPageIndex = Math.min(totalPages, activePageIndex + pagesAfterActive);
  if (startPageIndex > 1) {
    html += pageButtonHTML(1);
    startPageIndex = Math.min(activePageIndex, startPageIndex + 1);
    if (startPageIndex > 2) {
      html += ellipsis;
    }
  }
  if (endPageIndex < totalPages) {
    endPageIndex = Math.max(activePageIndex, endPageIndex - 1);
  }
  html += _.range(startPageIndex, endPageIndex + 1)
    .map((index) => pageButtonHTML(index))
    .join('');
  if (endPageIndex < totalPages - 1) {
    html += ellipsis;
  }
  if (endPageIndex < totalPages) {
    html += pageButtonHTML(totalPages);
  }
  html = prevButton + html + nextButton;
  return { html, startPageIndex, endPageIndex, totalPages };
};

const genInventoryItems = (itemsPerPage, pageIndex) => {
  const player = 玩家管理器.getPlayer();
  const totalPages = Math.ceil(player.背包.items.length / itemsPerPage);
  // 防止页数越界
  const trueActivePageIndex = _.clamp(pageIndex, 1, totalPages);
  const 背包面板背包 = $('#背包面板-背包');
  背包面板背包.empty();
  const itemsToRender = player.背包.items.slice(
    (trueActivePageIndex - 1) * itemsPerPage,
    trueActivePageIndex * itemsPerPage,
  );
  _.forEach(itemsToRender, (item) => {
    genItem(item, 背包面板背包);
  });
};

let _genPagination;

const pageButtonClicked = (parent, itemsPerPage, items, maxPages, activePageIndex, callback) => {
  _genPagination(parent, itemsPerPage, items, maxPages, activePageIndex, callback);
  callback({ parent, itemsPerPage, items, maxPages, activePageIndex });
};

const genPagination = (parent, itemsPerPage, items, maxPages, activePageIndex, callback) => {
  // 就算没有物品，也应该有一页。
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  // 防止页数越界
  const trueActivePageIndex = _.clamp(activePageIndex, 1, totalPages);
  // 生成分页栏
  const data = paginationHTML(totalPages, maxPages, trueActivePageIndex);
  parent.html(data.html);
  parent
    .attr('data-start-page-index', data.startPageIndex)
    .attr('data-end-page-index', data.endPageIndex)
    .attr('data-total-pages', data.totalPages)
    .attr('data-active-page-index', trueActivePageIndex)
    .attr('data-items-per-page', itemsPerPage);
  // 为每个按钮添加事件
  parent.find('[data-index]').each((_index, element) => {
    const pageIndex = parseInt($(element).attr('data-index'), 10);
    $(element).on('click', () => {
      if (pageIndex === trueActivePageIndex) {
        $.toast({ message: '已经在这一页了。', displayTime: 1000, class: 'error' });
        return;
      }
      pageButtonClicked(parent, itemsPerPage, items, maxPages, pageIndex, callback);
    });
  });
  parent.find('.prev-button').on('click', () => {
    if (trueActivePageIndex === 1) {
      $.toast({ message: '已经是第一页了。', displayTime: 1000, class: 'error' });
      return;
    }
    pageButtonClicked(parent, itemsPerPage, items, maxPages, trueActivePageIndex - 1, callback);
  });
  parent.find('.next-button').on('click', () => {
    if (trueActivePageIndex === totalPages) {
      $.toast({ message: '已经是最后一页了。', displayTime: 1000, class: 'error' });
      return;
    }
    pageButtonClicked(parent, itemsPerPage, items, maxPages, trueActivePageIndex + 1, callback);
  });
};

_genPagination = genPagination;

const genInventory = (activePageIndex = 1, refreshMenu = true, refreshPage = true) => {
  const player = 玩家管理器.getPlayer();
  const itemsPerPage = gameSettings.背包物品每页数量;

  if (refreshMenu) {
    const 选择背包分页 = $('#背包面板-选择背包分页');
    选择背包分页.empty();
    genPagination(
      选择背包分页,
      itemsPerPage,
      player.背包.items,
      gameSettings.背包页面最大数量,
      activePageIndex,
      ({ activePageIndex: _activePageIndex }) => genInventoryItems(itemsPerPage, _activePageIndex),
    );
  }
  if (refreshPage) {
    genInventoryItems(itemsPerPage, activePageIndex);
  }
};

/**
 * 检测分页菜单对应的数组中被操作的物品是否在当前页，index和startIndex、endIndex可以同时存在。
 * TODO: 以后换成更好的检测，应该是indices和startIndex和endIndex。
 * 目前用index（单数）是因为只给一个已经存在的物品堆叠，然后多出来的直接添加到背包末尾……应该循环添加给已经存在的物品，再将剩下的添加到末尾。
 * @param {JQuery<HTMLElement>} paginationMenu
 * @param {number} index 被操作物品在数组中的索引
 * @param {number} startIndex 被操作的多个物品的起始索引
 * @param {number} endIndex 被操作的多个物品的结束索引
 * @returns
 */
const isItemInPage = (paginationMenu, index, startIndex, endIndex) => {
  const activePageIndex = paginationMenu.attr('data-active-page-index');
  const itemsPerPage = paginationMenu.attr('data-items-per-page');
  const start = (activePageIndex - 1) * itemsPerPage;
  const end = activePageIndex * itemsPerPage - 1;
  return _.inRange(index, start, end) || (startIndex <= end && endIndex >= start);
};

const genEquipments = () => {
  const player = 玩家管理器.getPlayer();
  const 背包面板装备 = $('#背包面板-装备');
  背包面板装备.empty();
  _.forEach(player.装备, (typeEquipments) => {
    typeEquipments.forEach((equipment) => {
      genItem(equipment, 背包面板装备);
    });
  });
};

export {
  config,
  changeTab,
  labelHTML,
  genLabel,
  genProgressBar,
  updateProgressBar,
  genElementForStats,
  getCombatLayout,
  genCombatLayout,
  updateCombatLayout,
  genItem,
  genEquipments,
  genInventory,
  loadAndRenderMarkdown,
  isItemInPage,
};
