/* eslint-disable no-console */
import _ from 'lodash';

const messages = {
  logs: [],
  errors: [],
};

const exposed = {};

const isDevelopment = () => WEBPACK_MODE === 'development';
const isProduction = () => WEBPACK_MODE === 'production';

/**
 * 将变量添加到 window 对象中，方便调试。只有在webpack的development模式下才会添加，除非forced设为true。
 * @param {string} key
 * @param {*} value
 * @param {boolean} forced 是否忽略开发模式的限制。允许添加到生产环境。
 */
const addToWindow = (key, value, forced = false) => {
  // Will not add to window in production mode
  if (isDevelopment() || forced) {
    window[key] = value;
    exposed[key] = value;
  }
};

const toMessage = (params) => {
  let message = '';
  params.forEach((param) => {
    if (typeof param === 'string') {
      message += ` ${param}`;
    } else if (typeof param === 'object' && param !== null) {
      const transformedObject = _.cloneDeepWith(param, (value) => {
        if (value === undefined) {
          return 'undefined'; // 将 undefined 转换为字符串 'undefined', 否则会被JSON.stringify忽略
        }
        return value; // 确保返回原始值
      });
      message += JSON.stringify(transformedObject);
    } else if (param == null) {
      message += param === null ? ' null' : ' undefined';
    } else {
      message += ` ${param.toString()}`;
    }
  });
  return message.trim();
};

const log = (...params) => {
  messages.logs.push({
    message: params,
    timestamp: new Date(),
  });
  console.log(...params);
};

const error = (...params) => {
  messages.errors.push({
    message: params,
    timestamp: new Date().getTime(),
  });
  console.error(...params);
};

const printMessages = () => {
  console.log('Logs:');
  messages.logs.forEach((data) => {
    console.log(data.timestamp.toLocaleTimeString(), toMessage(data.message));
  });
  console.log('Errors:');
  messages.errors.forEach((data) => {
    console.log(data.timestamp.toLocaleTimeString(), toMessage(data.message));
  });
};

/**
 * 类似于Java的Objects.requireNonNull，检查targets是否包含null或undefined。
 * 只是简单的null check，不支持深度递归。
 * @param {Object<string, any>} targets key value pairs of variables to check.
 * @param {boolean} throwError
 * @returns Whether all targets are not null or undefined.
 */
const checkNotNull = (targets, throwError = true) => {
  const nullValues = {};
  _.forEach(targets, (value, key) => {
    if (value == null) {
      nullValues[key] = value;
    }
  });
  const success = _.isEmpty(nullValues);
  if (!success) {
    _.forEach(nullValues, (value, key) => {
      error(`"${key}" is ${value}`);
    });
    if (throwError) {
      throw new Error(`Null values found in notNull check.`);
    }
  }
  return success;
};

addToWindow('printMessages', printMessages, true);
addToWindow('messages', messages, true);
// 不用addToWindow，不然exposed会存自己。
window.exposed = exposed;

export { addToWindow, isDevelopment, isProduction, log, error, checkNotNull };
