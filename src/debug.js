const addToWindow = (key, value) => {
  // Will not add to window in production mode
  if (WEBPACK_MODE === 'development') {
    window[key] = value;
  }
};

export default addToWindow;
