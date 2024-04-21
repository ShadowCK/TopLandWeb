import _ from 'lodash';
import { config } from './settings.js';

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

export { getDecimalPrecision, getMaxLevel, template, templateFromElement, deepMapObject };
