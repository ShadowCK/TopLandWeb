import _ from 'lodash';
import Settings from './Settings.js';
import 技能 from './技能.js';
import { ComponentType } from '../enums.js';
import * as 组件管理器 from './组件管理器.js';
import * as debug from '../debug.js';

class EffectComponent {
  static #ICON_KEY = 'icon-key';

  static #COUNTS_KEY = 'counts';

  static #TYPE = 'type';

  /** @type {boolean} */
  static #passed;

  /** @type {EffectComponent[]} */
  children = [];

  settings = new Settings();

  /** @type {技能} */
  skill;

  /**
   * @returns {string}
   */
  getKey() {
    throw new Error('getKey() must be implemented by subclass');
  }

  /**
   * @returns {string}
   */
  getType() {
    throw new Error('getType() must be implemented by subclass');
  }

  /**
   * @returns {Settings}
   */
  getSettings() {
    return this.settings;
  }

  /**
   * @param {实体} caster
   * @param {string} key
   * @param {Number} level
   * @param {Number} fallback
   */
  parseValues = (caster, key, level, fallback) => {
    const base = this.getNum(caster, key + Settings.BASE, fallback);
    const scale = this.getNum(caster, key + Settings.SCALE, 0);
    const value = base + (level - 1) * scale;
    return value;
  };

  /**
   * @param {实体} caster
   * @param {string} key
   * @param {Number} fallback
   */
  getNum(caster, key, fallback) {
    const val = this.settings.getString(key);
    if (val === null) {
      return fallback;
    }
    // val是数字的情况
    let parsed = Number(val);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    // val是casterData的键名，返回对应的值
    const casterData = 技能.getCasterData(caster);
    if (val in casterData) {
      parsed = Number(casterData[val]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    // val是一个范围的情况(比如150-200)
    const mid = val.indexOf('-', 1);
    const min = Number(val.substring(0, mid));
    const max = Number(val.substring(mid + 1));
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return _.random(min, max, true);
    }
    return fallback;
  }

  lastPassed() {
    return EffectComponent.#passed;
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} targets
   */
  executeChildren(caster, level, targets = []) {
    if (targets.length === 0) {
      return false;
    }
    let worked = false;
    this.children.forEach((child) => {
      const counts =
        child.settings.getString(EffectComponent.#COUNTS_KEY, 'true').toLowerCase() !== 'false';
      EffectComponent.#passed = child.execute(caster, level, targets);
      worked = worked || (EffectComponent.#passed && counts);
    });
    return worked;
  }

  /**
   * @param {实体} caster
   */
  cleanup(caster) {
    this.doCleanup(caster);
    this.children.forEach((child) => {
      child.cleanup(caster);
    });
  }

  /**
   * @param {实体} caster
   */
  doCleanup(caster) {
    throw new Error('doCleanup() must be implemented by subclass');
  }

  /**
   * @param {实体} caster
   * @returns {实体技能}
   */
  getSkillData(caster) {
    return caster.技能[this.skill.key];
  }

  filter() {
    // TODO
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} targets
   */
  execute(caster, level, targets) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * @param {技能} skill
   * @param {Object<string, any>} config component config
   */
  load(skill, config) {
    this.skill = skill;
    if (config == null) {
      return;
    }
    // Read settings
    if (config.data == null) {
      throw new Error('Invalid component config - data cannot be null');
    }
    this.settings.load(config.data);
    if (this.settings.has(EffectComponent.#ICON_KEY)) {
      const key = this.settings.getString(EffectComponent.#ICON_KEY);
      if (key != null && key !== '') {
        skill.setAttribKey(key, this);
      }
    }
    // Read children
    const { children } = config;
    if (children != null) {
      _.forEach(children, (childConfig, key) => {
        try {
          const componentType = childConfig[EffectComponent.#TYPE];
          if (!(componentType in ComponentType)) {
            throw new Error(`Invalid component type: ${componentType}`);
          }
          const componentKey = key.replaceAll('-.+', '');
          /** @type {EffectComponent} */
          const child = 组件管理器.getComponent(componentType, componentKey);
          if (child != null) {
            child.load(skill, childConfig);
            this.children.push(child);
          } else {
            throw new Error(`Invalid ${componentType} component: ${componentKey}`);
          }
        } catch (error) {
          debug.error(error);
        }
      });
    }
  }
}

export default EffectComponent;
