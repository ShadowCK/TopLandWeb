import _ from 'lodash';
import * as debug from '../debug.js';

class Settings {
  static BASE = '-base';

  static SCALE = '-scale';

  /** @type {Object<string, any} */
  #settings = {};

  load(config) {
    if (config == null || !_.isObject(config)) {
      console.error(new Error('Invalid settings config'));
    }
    this.#settings = _.cloneDeep(config);
  }

  /**
   * @param {Settings} settings
   */
  copyFrom(settings) {
    this.#settings = _.cloneDeep(settings.#settings);
  }

  set(key, value) {
    this.#settings[key] = value;
    return this;
  }

  setAttr(key, base, scale) {
    this.#settings[key + Settings.BASE] = base;
    this.#settings[key + Settings.SCALE] = scale;
    return this;
  }

  setBase(key, value) {
    if (!_.isNumber(this.#settings[key + Settings.SCALE])) {
      this.#settings[key + Settings.SCALE] = 0;
    }
    this.#settings[key + Settings.BASE] = value;
    return this;
  }

  setScale(key, value) {
    if (!_.isNumber(this.#settings[key + Settings.BASE])) {
      this.#settings[key + Settings.BASE] = 0;
    }
    this.#settings[key + Settings.SCALE] = value;
    return this;
  }

  /**
   * @param {string} key
   * @param {number} defaultValue
   * @returns
   */
  getNumber(key, defaultValue = 0) {
    if (key in this.#settings) {
      return Number(this.#settings[key]);
    }
    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * @param {string} key
   * @param {boolean} defaultValue
   * @returns
   */
  getBoolean(key, defaultValue) {
    if (key in this.#settings) {
      return !!this.#settings[key];
    }
    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * @param {string} key
   * @param {string | null} defaultValue
   * @returns {string | null}
   */
  getString(key, defaultValue = null) {
    if (this.#settings[key] != null) {
      return this.#settings[key].toString();
    }
    this.set(key, defaultValue);
    return defaultValue;
  }

  getStrings(key) {
    if (this.#settings[key] != null) {
      const value = this.#settings[key];
      if (Array.isArray(value)) {
        return value.map((v) => v.toString());
      }
      return [value.toString()];
    }
    return [];
  }

  getBase(key) {
    const base = this.#settings[key + Settings.BASE];
    if (base == null) {
      return 0;
    }
    return Number(base);
  }

  getScale(key) {
    const scale = this.#settings[key + Settings.SCALE];
    if (scale == null) {
      return 0;
    }
    return Number(scale);
  }

  getAttr(key, level, defaultValue = 0) {
    if (!this.has(key)) {
      this.setAttr(key, defaultValue, 0);
    }
    return this.getBase(key) + this.getScale(key) * (level - 1);
  }

  get(key, level) {
    if (key in this.#settings) {
      return this.#settings[key];
    }
    if (key + Settings.BASE in this.#settings) {
      return this.getAttr(key, level);
    }
    return 0;
  }

  has(key) {
    return key in this.#settings || key + Settings.BASE in this.#settings;
  }

  remove(key) {
    delete this.#settings[key];
    delete this.#settings[key + Settings.BASE];
    delete this.#settings[key + Settings.SCALE];
  }

  checkDefault(key, defaultBase, defaultScale) {
    if (!this.has(key)) {
      this.setAttr(key, defaultBase, defaultScale);
    }
  }
}

export default Settings;
