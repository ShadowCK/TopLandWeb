import * as 组件管理器 from './组件管理器.js';

class TriggerHandler {
  /** @type {Object<number,number>} */
  active = {};

  /** @type {技能} */
  skill;

  /** @type {string} */
  key;

  /** @type {Trigger} */
  trigger;

  /** @type {TriggerComponent} */
  component;

  /**
   * @param {技能} skill
   * @param {string} key
   * @param {Trigger} trigger
   * @param {TriggerComponent} component
   */
  constructor(skill, key, trigger, component) {
    this.skill = skill;
    this.key = key;
    this.trigger = trigger;
    this.component = component;
  }

  getKey() {
    return this.key;
  }

  getTrigger() {
    return this.trigger;
  }

  getComponent() {
    return this.component;
  }

  /**
   * @param {实体} entity
   * @param {Number} level
   */
  init(entity, level) {
    this.active[entity.uuid] = level;
  }

  /**
   * @param {实体} entity
   */
  cleanup(entity) {
    delete this.active[entity.uuid];
    this.component.cleanup(entity);
  }

  register() {
    this.trigger
      .getEmitter()
      .on(this.trigger.getEvent(), (eventData) =>
        组件管理器.getListener(this.trigger)(this, eventData),
      );
  }
}

export default TriggerHandler;
