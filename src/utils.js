import _ from 'lodash';
import { config } from './settings.js';

/**
 * 获取职业的有效最大等级
 * @param {number} baseMaxLevel 基础最大等级
 * @param {number} expertiseLevel 专精等级
 * @returns
 */
const getMaxLevel = (baseMaxLevel, expertiseLevel) =>
  baseMaxLevel + expertiseLevel * config.extraLevelsPerExpertiseLevel;

const template = (str, data) =>
  str.replace(/{{(.*?)}}/gs, (match, key) =>
    typeof data[key] !== 'undefined' ? data[key] : match,
  );

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

export { getMaxLevel, template, templateFromElement };
