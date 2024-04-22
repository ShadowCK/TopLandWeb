import _ from 'lodash';
import { config } from './settings.js';
import { StatType } from './combat/战斗属性.js';

const getDecimalPrecision = (num) => {
  if (!_.isFinite(num)) {
    return 0; // 如果数字不是有限的，返回0
  }
  let e = 1;
  let p = 0;
  while (Math.round(num * e) / e !== num) {
    e *= 10;
    p += 1;
  }
  return p;
};

/**
 * 获取职业的有效最大等级
 * @param {number} baseMaxLevel 基础最大等级
 * @param {number} expertiseLevel 专精等级
 * @returns
 */
const getMaxLevel = (baseMaxLevel, expertiseLevel) =>
  baseMaxLevel + expertiseLevel * config.extraLevelsPerExpertiseLevel;

const template = (str, data) =>
  str.replace(/{{(.*?)}}/gs, (match, key) => (data[key] !== undefined ? data[key] : match));

const templateFromElement = (element, data, apply = true) => {
  // 使用jQuery缓存模板
  const e = $(element);
  const str = e.data('template') || e.text();
  if (!e.data('template')) {
    e.data('template', str);
  }
  const result = template(str, data);
  if (apply) {
    e.text(result);
  }
  return result;
};

/**
 *
 * @param {Object} obj
 * @param {Function} callback (path: string[], settings) => {...}
 * @param {Object} settings
 * @param {string} path 递归用，不要传入
 * @param {Ojbect} result 递归用，不要传入
 * @returns
 */
const deepMapObject = (obj, callback, settings, path = [], result = {}) => {
  _.forEach(obj, (value, key) => {
    const newPath = [...path, key];
    if (_.isObject(value) && !_.isArray(value)) {
      deepMapObject(value, callback, settings, newPath, result);
    } else {
      _.set(result, newPath, callback(newPath, settings));
    }
  });
  return result;
};

window.deepMapObject = deepMapObject;

const calcHealing = (entity, value) => {
  if (value <= 0) {
    return 0;
  }
  const 原始生命值 = entity.生命值;
  const 最大生命值 = entity.getStat2(StatType.最大生命值);
  const 生命回复效率 = entity.getStat2(StatType.生命回复效率);
  const 新生命值 = Math.min(最大生命值, entity.生命值 + value * 生命回复效率);
  return 新生命值 - 原始生命值;
};

const randomCoordinate = (min, max) => {
  const magnitude = _.random(min, max, true);
  const sign = Math.random() < 0.5 ? -1 : 1;
  return magnitude * sign;
};

export {
  getDecimalPrecision,
  getMaxLevel,
  template,
  templateFromElement,
  deepMapObject,
  calcHealing,
  randomCoordinate,
};
