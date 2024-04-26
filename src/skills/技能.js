import _ from 'lodash';
import Settings from './Settings.js';
import * as debug from '../debug.js';
import TriggerHandler from './TriggerHandler.js';
import { getTrigger } from './组件管理器.js';
import TriggerComponent from './trigger/TriggerComponent.js';
import { SkillAttribute } from '../enums.js';

class 技能 {
  // Skill
  /** @type {Object<number, Object<string, any>>} */
  static casterData = {};

  /**
   * @param {实体} caster
   */
  static getCasterData(caster) {
    if (caster == null) {
      return null;
    }
    let data = this.casterData[caster.uuid];
    if (data === null) {
      return null;
    }
    if (data === undefined) {
      data = { caster };
      this.casterData[caster.uuid] = data;
    }
    return data;
  }

  /**
   * @param {实体} caster
   */
  static clearCasterData(caster) {
    delete this.casterData[caster.uuid];
  }

  // TODO: use this as a unique identifier of a duplicate skill in 实体技能，不要在这里使用
  key;

  name;

  description;

  type;

  message;

  maxLevel;

  requirements = {};

  settings = new Settings();

  // Dynamic Skill
  /** @type {TriggerHandler[]} */
  triggers = [];

  /** @type {Object<string, EffectComponent>} */
  attribKeys;

  /** @type {Object<number,number>} */
  active = {};

  castTrigger;

  initializeTrigger;

  cleanupTrigger;

  cancel = false;

  constructor(skillConfig) {
    // 读取基础设置
    Object.assign(
      this,
      _.cloneDeep(
        _.pick(skillConfig, ['name', 'description', 'type', 'message', 'maxLevel', 'requirements']),
      ),
    );
    this.key = this.name;
    // 读取其他属性，比如蓝耗，冷却时间，等级需求
    this.settings.load(skillConfig.attributes);

    // 读取组件
    const triggers = skillConfig.components;
    if (triggers == null) {
      return;
    }
    _.forEach(triggers, (_trigger, key) => {
      const modified = key.replace(/-.+/g, '_').toLowerCase();
      try {
        const config = triggers[key];
        if (modified === 'cast') {
          this.castTrigger = this.loadComponent(config);
        } else if (modified === 'initialize') {
          this.initializeTrigger = this.loadComponent(config);
        } else if (modified === 'cleanup') {
          this.cleanupTrigger = this.loadComponent(config);
        } else {
          this.triggers.push(
            new TriggerHandler(this, key, getTrigger(modified), this.loadComponent(config)),
          );
        }
      } catch (error) {
        debug.error(`技能触发器加载失败, ${this.name} - ${key}`, error);
      }
    });
  }

  getManaCost(level) {
    return this.settings.getAttr(SkillAttribute.MANA, level);
  }

  getCooldown(level) {
    return this.settings.getAttr(SkillAttribute.COOLDOWN, level);
  }

  getLevelReq(level) {
    return this.settings.getAttr(SkillAttribute.LEVEL, level + 1);
  }

  loadComponent(config) {
    const component = new TriggerComponent();
    component.load(this, config);
    return component;
  }

  canCast() {
    return this.castTrigger != null;
  }

  /**
   * @param {实体} caster
   */
  isActive(caster) {
    return this.active[caster.uuid];
  }

  setAttribKey(key, component) {
    this.attribKeys[key] = component;
  }

  cancelTrigger() {
    this.cancel = true;
  }

  checkCancelled() {
    const result = this.cancel;
    this.cancel = false;
    return result;
  }

  applyCancelled(eventData) {
    if (this.checkCancelled()) {
      eventData.cancelled = true;
    }
  }

  registerEvents() {
    this.triggers.forEach((triggerHandler) => {
      triggerHandler.register();
    });
  }

  /**
   * @param {实体} user
   * @param {Number} prevLevel
   * @param {Number} newLevel
   */
  update(user, prevLevel, newLevel) {
    this.active[user.uuid] = newLevel;
    this.triggers.forEach((triggerHandler) => {
      triggerHandler.init(user, newLevel);
    });
  }

  /**
   * @param {实体} user
   * @param {Number} level
   */
  initialize(user, level) {
    this.trigger(user, user, level, this.initializeTrigger);
    this.active[user.uuid] = level;
    this.triggers.forEach((triggerHandler) => {
      triggerHandler.init(user, level);
    });
  }

  /**
   * @param {实体} user
   * @param {Number} level
   */
  stopEffects(user, level) {
    delete this.active[user.uuid];
    this.triggers.forEach((triggerHandler) => {
      triggerHandler.cleanup();
    });
    this.cleanup(user, this.castTrigger);
    this.cleanup(user, this.initializeTrigger);

    this.trigger(user, user, 1, this.cleanupTrigger);
  }

  /**
   * @param {实体} user
   * @param {TriggerComponent} component
   */
  cleanup(user, component) {
    if (component != null) {
      component.cleanup(user);
    }
  }

  /**
   * @param {实体} user
   * @param {Number} level
   */
  cast(user, level) {
    return this.trigger(user, user, level, this.castTrigger);
  }

  /**
   * @param {实体} caster
   * @param {string} key
   * @param {Number} level
   */
  getAttr(caster, key, level) {
    // 返回拥有icon-key组件的属性
    if (key.includes('.')) {
      const path = key.split('.');
      const iconKey = path[0];
      const attr = path[1].toLowerCase();
      const component = this.attribKeys[iconKey];
      if (component != null && component.settings.has(attr)) {
        return component.parseValues(caster, attr, level, 0);
      }
      return 0;
    }
    // 否则返回技能的属性
    return this.settings.get(key, level);
  }

  /**
   * @param {实体} user
   * @param {实体} target
   * @param {Number} level
   * @param {TriggerComponent} component
   */
  trigger(user, target, level, component) {
    return component != null && component.trigger(user, target, level);
  }
}

export default 技能;
