import _ from 'lodash';
import { config } from './settings.js';
import { StatType } from './combat/战斗属性.js';
import { addToWindow } from './debug.js';

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

const templateFromElement = (element, data, apply = true, isText = true) => {
  // 使用jQuery缓存模板
  const e = $(element);

  if (isText) {
    if (!e.data('template')) {
      e.data('template', e.text());
    }
    const str = e.data('template');
    const result = template(str, data);
    if (apply) {
      e.text(result);
    }
    return result;
  }
  if (!e.data('template')) {
    e.data('template', e.html());
  }
  const html = e.data('template');
  if (!e.data('template')) {
    e.data('template', html);
  }
  const result = template(html, data);
  if (apply) {
    e.html(result);
  }
  return result;
};

/**
 *
 * @param {Object} obj
 * @param {Function} callback (path: string[], settings) => {...}
 * @param {Object} settings
 * @param {string[]} path 递归用，不要传入
 * @param {Object} result 递归用，不要传入
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

addToWindow('deepMapObject', deepMapObject, true);

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

const applyStats = (stats, setValueCallback, recurConditional) => {
  let callback = setValueCallback;
  if (callback == null || !(callback instanceof Function)) {
    callback = ({ value, currentPath }) => {
      _.set(stats, currentPath, value);
    };
  }
  let conditional = recurConditional;
  if (conditional == null || !(conditional instanceof Function)) {
    conditional = (value) => _.isObject(value);
  }
  const recur = (obj, path = []) => {
    _.forEach(obj, (value, key) => {
      const currentPath = path.concat(key);
      if (conditional(value)) {
        recur(value, currentPath);
      } else {
        callback({ value, currentPath, obj });
      }
    });
  };
  return recur(stats);
};

const sampleWeighted = (array, baseMult = 0) => {
  const totalWeight = array.reduce((acc, element) => acc + element.weight, 0);
  const rand = _.random(Math.min(baseMult, 1) * totalWeight, totalWeight, true);
  let sum = 0;
  return array.find((element) => {
    sum += element.weight;
    return rand <= sum;
  });
};

const findLeaves = (obj, path = '') =>
  _.reduce(
    obj,
    (result, value, key) => {
      const currentPath = path ? `${path}.${key}` : key;
      if (_.isObject(value) && !_.isEmpty(value)) {
        _.extend(result, findLeaves(value, currentPath));
      } else {
        result[currentPath] = value;
      }
      return result;
    },
    {},
  );

export {
  getDecimalPrecision,
  getMaxLevel,
  template,
  templateFromElement,
  deepMapObject,
  calcHealing,
  randomCoordinate,
  applyStats,
  sampleWeighted,
  findLeaves,
};
