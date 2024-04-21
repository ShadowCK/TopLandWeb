const isDevelopment = () => WEBPACK_MODE === 'development';
const isProduction = () => WEBPACK_MODE === 'production';

const addToWindow = (key, value) => {
  // Will not add to window in production mode
  if (isDevelopment()) {
    window[key] = value;
  }
};

export { addToWindow, isDevelopment, isProduction };
