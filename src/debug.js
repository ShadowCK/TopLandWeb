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
  }
};

export { addToWindow, isDevelopment, isProduction };
