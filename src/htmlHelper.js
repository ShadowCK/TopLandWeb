import _ from 'lodash';
import { setTimeout } from 'worker-timers';
import showdown from 'showdown';

import * as 玩家管理器 from './player/玩家管理器.js';
import { getDecimalPrecision } from './utils.js';
import { StatType } from './combat/战斗属性.js';
import 装备 from './items/装备.js';
import { EquipRarity, EquipRarityInverted, SemanticUIColor } from './enums.js';
import { 计算伤害分布 } from './combat/战斗管理器.js';
import { ItemRequirementChinese } from './localization.js';
import { getEquipColor } from './settings.js';

const Format = {
  生命条格式: '生命值: {value} / {total}',
  魔法条格式: '魔法值: {value} / {total}',
  经验条格式: '经验值: {value} / {total}',
  攻击条格式: '下次攻击: {value} / {total}',
  刷怪计时进度条格式: '新敌人出现: {value} / {total}',
  必刷BOSS进度条格式: 'BOSS必定出现: {value} / {total}',
  默认进度条格式: '{value} / {total}',
};

const randomColor = () => _.sample(SemanticUIColor);

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
      const { name, settings = '' } = tags[i];
      result = `<${name} ${settings}>${result}</${name}>`;
    }
  }
  return result;
};

/**
 * @param {string[]} htmlStrings Array of HTML strings
 * @param {{name: string, settings: string}} tags
 * @returns {string[]} Array of wrapped HTML strings
 */
const wrapHtmls = (htmlStrings, tags, join = false) => {
  const result = htmlStrings.reduce((acc, cur) => {
    acc.push(wrapHtml(cur, tags));
    return acc;
  }, []);
  return join ? result.join('') : result;
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

const labelHTML2 = ({ title, detail, content, className, isHorizontal = true }) => {
  const classStr = className != null ? ` ${className}` : '';
  const horizontalStr = isHorizontal ? ' horizontal' : '';
  const settings = `class="ui${classStr}${horizontalStr} label"`;
  return /* html */ `
    <div ${settings}>
      ${title != null ? title : ''}
      ${detail != null ? `<div class="detail">${detail}</div>` : ''}
    </div>
    ${content != null ? content : ''}
    `;
};

/**
 * @param {boolean} inline 实际上没有作用，因为fomantic-ui的.ui.label就是inline-block。
 * @deprecated
 */
const labelHTML = (title, content, className = '', inline = false) => {
  const settings = className
    ? `class="ui ${className} horizontal label"`
    : 'class="ui horizontal label"';
  return /* html */ `
    ${wrapHtml(title, [{ name: inline ? 'span' : 'div', settings }])}
    ${content != null ? content : ''}
    `;
};

const genLabel = (title, content, className = '') => {
  const label = $(labelHTML(title, content, className));
  return label;
};

const progressBarHTML = ({
  id,
  className = '',
  color = '',
  label = '',
  value = 0,
  maxValue = 1,
  centered = false,
}) =>
  `
  <div ${id ? `id="${id}" ` : ''}class="ui ${color} progress active ${className}" data-percent="${
    (value / maxValue) * 100
  }">
    <div class="bar">
      <div class="${centered ? 'centered ' : ''}progress"></div>
    </div>
    <div class="label">${label}</div>
  </div>
  `;

const genProgressBar = ({
  parent,
  format,
  id,
  className = '',
  color = '',
  label = '', // 默认标签。可忽略。只在被更新前（或更新时没有format）有用。
  value = 0,
  maxValue = 1,
  centered = false,
}) => {
  const bar = $(progressBarHTML({ id, className, color, label, value, maxValue, centered }));
  // 初始化进度条
  bar.progress(format ? { text: { active: format } } : {});
  if (parent != null) {
    parent.append(bar);
  }
  return bar;
};

const updateProgressBar = (
  bar,
  value,
  maxValue,
  format = '{value} / {total}',
  precision = 0,
  useRatio = false,
  step = null, // 较大的step可以减少进度条动画频繁刷新导致的视觉顿挫感
) => {
  const element = _.isString(bar) ? $(bar) : bar;
  if (step != null) {
    /* eslint-disable no-param-reassign */
    value = _.round(value / step) * step;
    maxValue = _.round(maxValue / step) * step;
    /* eslint-enable no-param-reassign */
  }
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
  const parsedFormat = format
    .replace(/{value}/g, value === Infinity ? '∞' : _.round(value, precision))
    .replace(/{total}/g, maxValue === Infinity ? '∞' : _.round(maxValue, precision));
  if (useRatio) {
    element.progress({
      total: maxValue,
      percent,
      label: 'ratio',
      text: {
        ratio: parsedFormat,
      },
    });
    return;
  }
  element.progress({
    total: maxValue,
    percent,
    text: {
      active: parsedFormat,
    },
  });
};

const getCombatLayout = (parent, entity) => parent.find(`#${entity.uuid}`);

/**
 * @param {实体} entity
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
    Format.生命条格式,
  );
  updateProgressBar(
    combatLayout.find('.mana-bar'),
    entity.魔法值,
    entity.getStat2(StatType.最大魔法值),
    Format.魔法条格式,
  );
  updateProgressBar(
    combatLayout.find('.attack-bar'),
    entity.攻击计时器去掉攻速(),
    entity.实际攻击间隔(),
    Format.攻击条格式,
    2,
  );
};

/**
 * @param {实体} entity
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
    formatted = `<span>${value[0]}<i class="angle double up icon"></i>${value[1]}</span>`;
  } else {
    const isStat = _.get(entity.stats, path) !== undefined;
    // 如果是实体属性，不要用原始数值。显示buff加成后的数值
    // FIXME: 这里会浪费一些性能，因为已经有base了。getBuffedStat会更好。
    // TODO: 还有，要把getStat的clamp放到getBuffedStat里面，让getBuffedStat也接受range参数。
    const valueToUse = isStat ? entity.getStat2(path) : value; // TODO: 可以切换显示模式，显示原始值。目前显示的是有效范围内的。但是BUFF可以让他超出范围。
    // 如果是实体属性，精确到成长的小数位数
    let precision;
    if (isStat) {
      const statGrowth = entity.getStatGrowth(path);
      // 成长是0，精确到基础值的小数位数后一位（比如1.5精确到1.50，否则精确到成长值的小数位数
      precision =
        statGrowth[1] === 0
          ? getDecimalPrecision(statGrowth[0]) + 1
          : getDecimalPrecision(statGrowth[1]);
    } else {
      precision = 2; // 默认精确到小数点后两位
    }
    formatted = _.round(valueToUse, precision);
    if (isStat) {
      const parentKey = path[path.length - 2];
      if (parentKey !== undefined && parentKey === StatType.伤害分布) {
        const damageDistributionData = 计算伤害分布(entity.getStat3(StatType.伤害分布))[key];
        if (damageDistributionData) {
          formatted = /* html */ `${formatted}(${_.round(
            damageDistributionData.proportion * 100,
            2,
          )}%) <span class="ui grey text">+${_.round(
            damageDistributionData.singleBonus * 100,
            2,
          )}%</span> <span class="ui red text">+${_.round(
            damageDistributionData.totalBonus * 100,
            2,
          )}%</span>`;
        }
      }
    }
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

/**
 * @param {物品} item
 * @returns {string} HTML string
 */
const genItemHTML = (item) => {
  const isEquipment = item instanceof 装备;
  let cardStyle = '';
  let nameStyle = '';
  let imageStyle = '';
  let nameStr = item.name;
  let 装备炫光 = '';
  if (isEquipment) {
    const { 品阶, 品质 } = item;
    const 合成等级 = item.获取合成等级();
    const dropShadowBlur = _.clamp(品阶 * 0.5, 0, 20);
    const dropShadowColor = getEquipColor(品质, ([r, g, b, a]) => {
      const newAlpha = _.clamp(a * (合成等级 / 100), a, 1);
      return [r, g, b, newAlpha];
    });
    const textColor = getEquipColor(品质, ([r, g, b]) =>
      品质 === EquipRarity.普通 ? [255, 255, 255, 1] : [r, g, b, 1],
    );
    cardStyle += `filter: drop-shadow(0 0 ${dropShadowBlur}px ${dropShadowColor});`;
    nameStyle += `color: ${textColor};`;
    imageStyle +=
      'clip-path: polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%);';
    nameStr = `${item.name} +${item.品阶}`;
    if (品质 >= EquipRarity.史诗) {
      装备炫光 = ' 炫光';
    }
  } else {
    nameStyle += `color: white;`;
    imageStyle += 'border-radius: .28571429rem !important;';
  }
  // 悬浮在图片上的名字
  const nameHTML = /* html */ `<div class="背包物品-悬浮文字" style="display:flex; text-align: center; align-items: center; justify-content: center; position: absolute; width: 100%; height: 100%; top: 50%; left: 50%; transform: translate(-50%, -50%)"><span class="ui text" style="font-size: max(1em, 15cqw); ${nameStyle}">${nameStr}</span></div>`;
  return /* html */ `
  <div class="column">
    <div class="ui card 背包物品" style="container-type: inline-size; box-shadow: none; background: none; ${cardStyle}">
      <div class="ui image placeholder 背包物品-图片${装备炫光}"${
    isEquipment ? ` data-品质="${EquipRarityInverted[item.品质]}"` : ''
  } style="${imageStyle}">
        <div class="square icon image"></div>
        ${nameHTML}
      </div>
    </div>
  </div>
  `;
};

/**
 * @param {物品} item
 */
const genItem = (item) => {
  const isEquipment = item instanceof 装备;
  const wrapper = $(genItemHTML(item));
  const card = wrapper.find('.ui.card');
  if (isEquipment) {
    card.css('cursor', 'pointer');
    card.on('click', () => {
      const player = 玩家管理器.getPlayer();
      if (player.拥有装备(item)) {
        item.脱下(player);
      } else if (player.背包.hasItem(item)) {
        const success = item.穿上(player);
        if (!success) {
          $.toast({
            message:
              '装备失败。可能的情况：不满足装备要求，该类型的装备槽数量为0，或已经装备了该物品（异常）。',
            displayTime: 2000,
            showProgress: 'bottom',
            class: 'error chinese',
          });
        }
      } else {
        console.error('玩家没有这个装备');
      }
    });
  }
  // popup content
  const tempParent = $(/* html */ `
    <div>
      <h3 class="ui header"><span class="装备品质"></span>${
        item.name
      }<span class="装备等级"></span><span class="装备品阶"></span></h3>
      <div class="ui horizontal list">
      ${labelHTML(item.type)}
      <div class="装备标签">这个元素的outerHTML会被替换</div>
      </div>
      ${isEquipment ? '<div class="装备需求容器"></div>' : ''}
      <div class="ui message">
        <p>${item.description}</p>
      </div>
      ${isEquipment ? '<div class="ui horizontal wrapping segments 装备属性容器"></div>' : ''}
    </div>
    `);
  if (isEquipment) {
    const 装备需求容器 = tempParent.find('.装备需求容器');
    _.forEach(item.requirements, (value, key) => {
      const mapped = ItemRequirementChinese[key];
      if (mapped == null) {
        return;
      }
      装备需求容器.append(
        labelHTML(mapped, `<span style="margin-right:0.5em">${value}</span>`, 'red'),
      );
    });

    const 装备属性容器 = tempParent.find('.装备属性容器');
    _.forEach(item.获取实际属性(), (value, key) => {
      genElementForEquipmentStat(装备属性容器, value, key, 'small');
    });
  }
  card.attr('data-variation', 'flowing');
  card.popup({
    on: 'hover',
    // inline可以apply local CSS rules，让它看起来更对，但是不会在关闭时自动移除
    // TODO: 设为true, 在父元素被删除时移除popup
    inline: false,
    lastResort: true,
    hoverable: false,
    delay: {
      show: 0,
      hide: 0,
    },
    html: compressHTML(tempParent.html()),
    onShow:
      /**
       * @this {JQuery<HTMLElement>}
       */
      function onShow() {
        if (isEquipment) {
          this.find('.装备品质').text(`[${EquipRarityInverted[item.品质]}]`);
          this.find('.装备等级').text(` LV.${_.round(item.获取合成等级())}`);
          this.find('.装备品阶').text(` +${item.品阶}`);
          this.find('.装备标签').get(0).outerHTML = /* html */ `
              ${labelHTML(item.slot)}
              ${labelHTML2({ title: '合成次数', detail: `${item.合成次数}` })}
              ${labelHTML2({ title: '品质倍率', detail: `X${_.round(item.获取品质倍率(), 2)}` })}
              ${labelHTML2({ title: '合成增益', detail: `X${_.round(item.获取合成增益(), 2)}` })}
              ${labelHTML2({ title: '品阶增益', detail: `X${_.round(item.获取品阶增益(), 2)}` })}
              `;
        }
      },
    onCreate: function onCreate() {
      this.addClass('chinese');
      if (!isEquipment) {
        this.find('.装备标签').remove();
        this.find('.装备品质').remove();
        this.find('.装备等级').remove();
      }
    },
  });
  // 右键打开物品的context menu
  // 创建一个新的隐藏div绑定到右键菜单的popup，好处是不会影响原来的popup（一个元素只能有一个popup）
  // TODO: 为什么先创建元素并注册popup, 添加css等再append就不会有效，上面的明明可以
  const hidden = card.append('<div></div>').children().last();
  hidden.css({
    visibility: 'hidden',
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
  });
  const contextHTML = /* html */ `
      <div class="ui huge vertical menu" style="width: 20rem">
        <div class="item 丢弃菜单">
          <div class="header">丢弃</div>
          <div class="menu">
            <a class="item" data-use="丢弃当前物品">当前物品</a>
            <a class="item" data-use="丢弃同名物品">
              同名物品
              <div class="ui label">0</div>
            </a>
            <a class="item" data-use="丢弃全部物品">
              全部物品
              <div class="ui label">0</div>
            </a>
            <a class="item" data-use="丢弃非最高阶物品">
              非最高阶物品（< <span class="最高品阶">0</span>）
            <div class="ui label">0</div>
          </a>
          </div>
        </div>
        <div class="item 合成菜单">
          <div class="header">合成</div>
          <span class="ui small text">保留最高品质。只能和同阶或高阶合成。</span>
          <div class="menu">
            <a class="item" data-use="合成全部物品">
              全部物品
              <div class="ui label">0</div>
            </a>
            <a class="item" data-use="合成同阶物品">
              同阶物品
              <div class="ui label">0</div>
            </a>
          </div>
        </div>
      </a>
      </div>
      `;
  const player = 玩家管理器.getPlayer();
  let hoveredContextMenu = false;
  hidden.popup({
    on: 'manual', // 注意：设置为manual后fomantic-ui不会有任何事件监听，要手动控制。
    html: contextHTML,
    inline: true,
    lastResort: true,
    exclusive: true,
    onShow: function onShow() {
      card.css('z-index', 1000); // 防止popup被其他card遮挡
      const 同名物品数量 = player.背包.countItem(item.name);
      this.find('[data-use="丢弃同名物品"] .ui.label').text(同名物品数量 - 1); // 去掉当前物品
      this.find('[data-use="丢弃全部物品"] .ui.label').text(同名物品数量);
      if (isEquipment) {
        const 最高品阶 = player.背包.items.reduce(
          (acc, cur) => (cur.name === item.name && cur.品阶 > acc ? cur.品阶 : acc),
          item.品阶,
        );
        this.find('.最高品阶').text(最高品阶);
        const 同名非最高阶物品数量 = player.背包.countItem(
          item.name,
          (other) => other.品阶 < 最高品阶,
        );
        this.find('[data-use="丢弃非最高阶物品"] .ui.label').text(同名非最高阶物品数量);

        const 可合成装备数量 = player.背包.获取可合成装备(item).length;
        const 可合成同阶装备数量 = player.背包.获取可合成装备(
          item,
          (other) => other.品阶 === item.品阶,
        ).length;
        this.find('[data-use="合成全部物品"] .ui.label').text(可合成装备数量);
        this.find('[data-use="合成同阶物品"] .ui.label').text(可合成同阶装备数量);
      }
      return true;
    },
    onHide: function onHide() {
      card.css('z-index', '');
    },
    onCreate: function onCreate() {
      this.addClass('chinese');
      this.on('click', (e) => {
        e.stopPropagation();
      });
      this.on('mouseenter', (e) => {
        e.stopPropagation();
      });
      this.addClass('context-menu');
      this.find('[data-use="丢弃当前物品"]').on('click', () => {
        player.dropItem(item);
        $.toast({
          class: 'chinese',
          message: `你丢掉了${item.name}。`,
        });
      });
      this.find('[data-use="丢弃同名物品"]').on('click', () => {
        const 同名物品数量 = player.背包.countItem(item.name);
        const 同名物品 = player.背包.items.filter((i) => i.name === item.name);
        player.dropItems(同名物品);
        $.toast({
          class: 'chinese',
          message: `你丢掉了${item.name} X${同名物品数量}。`,
        });
      });
      if (!isEquipment) {
        this.find('[data-use="丢弃非最高阶物品"]').remove();
        this.find('.合成菜单').remove();
      } else {
        this.find('[data-use="丢弃非最高阶物品"]').on('click', () => {
          const 最高品阶 = player.背包.items.reduce(
            (acc, cur) => (cur.name === item.name && cur.品阶 > acc ? cur.品阶 : acc),
            item.品阶,
          );
          const 同名非最高阶物品 = player.背包.items.filter(
            (other) => other.name === item.name && other.品阶 < 最高品阶,
          );
          player.dropItems(同名非最高阶物品);
          $.toast({
            class: 'chinese',
            message: `你丢掉了${item.name} X${同名非最高阶物品.length}。`,
          });
        });
        this.find('[data-use="合成全部物品"]').on('click', () => {
          const 可合成装备 = player.背包.获取可合成装备(item);
          if (可合成装备.length === 0) {
            $.toast({
              class: 'error chinese',
              message: '没有可合成的装备。',
            });
            return;
          }
          const 原装备等级 = _.round(item.获取合成等级());
          可合成装备.forEach((other) => {
            item.合成(other);
          });
          player.dropItems(可合成装备);
          $.toast({
            class: 'chinese',
            message: `吸收了${可合成装备.length}件装备。装备等级: ${原装备等级} => ${_.round(
              item.获取合成等级(),
            )}`,
          });
        });
        this.find('[data-use="合成同阶物品"]').on('click', () => {
          const 可合成同阶装备 = player.背包.获取可合成装备(
            item,
            (other) => other.品阶 === item.品阶,
          );
          if (可合成同阶装备.length === 0) {
            $.toast({
              class: 'error chinese',
              message: '没有可合成的同阶装备。',
            });
            return;
          }
          const 原装备等级 = _.round(item.获取合成等级());
          可合成同阶装备.forEach((other) => {
            item.合成(other);
          });
          player.dropItems(可合成同阶装备);
          $.toast({
            class: 'chinese',
            message: `吸收了${
              可合成同阶装备.length
            }件同阶装备。装备等级: ${原装备等级} => ${_.round(item.获取合成等级())}`,
          });
        });
      }
      this.on('mouseenter', () => {
        hoveredContextMenu = true;
      });
      this.on('mouseleave', () => {
        hoveredContextMenu = false;
      });
    },
  });
  card.on('contextmenu', (e) => {
    e.preventDefault();
    // 已经装备的装备需要先脱下，避免执行丢弃同名物品、合成等操作时考虑太多情况
    if (isEquipment && player.拥有装备(item)) {
      $.toast({
        class: 'red chinese',
        message: `请先脱下装备再进行操作。`,
      });
      return;
    }
    hidden.popup('show');
  });
  card.on('mouseleave', () => {
    setTimeout(() => {
      if (!hoveredContextMenu) {
        hidden.popup('hide');
      }
    }, 100);
  });
  return wrapper;
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

const genEquipments = () => {
  const player = 玩家管理器.getPlayer();
  const 背包面板装备 = $('#背包面板-装备');
  背包面板装备.empty();
  _.forEach(player.装备, (typeEquipments) => {
    typeEquipments.forEach((equipment) => {
      背包面板装备.append(genItem(equipment));
    });
  });
};

const getPositionData = (element) => {
  const $element = $(element);
  const offset = $element.offset(); // 返回 { top: value, left: value }
  const width = $element.width();
  const height = $element.height();
  const centerX = offset.left + width / 2;
  const centerY = offset.top + height / 2;
  return { offset, width, height, centerX, centerY };
};

export {
  Format,
  changeTab,
  labelHTML2,
  labelHTML,
  genLabel,
  genProgressBar,
  updateProgressBar,
  genElementForStats,
  getCombatLayout,
  genCombatLayout,
  updateCombatLayout,
  genItem,
  genItemHTML,
  genEquipments,
  loadAndRenderMarkdown,
  randomColor,
  getPositionData,
  paginationHTML,
  wrapHtml,
  wrapHtmls,
};
