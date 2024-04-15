const template = (str, data) =>
  str.replace(/{{(.*?)}}/gs, (match, key) =>
    typeof data[key] !== 'undefined' ? data[key] : match,
  );

export { template };
