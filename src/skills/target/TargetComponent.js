import { ComponentType } from '../../enums.js';
import EffectComponent from '../EffectComponent.js';
import * as debug from '../../debug.js';
import * as 战斗管理器 from '../../combat/战斗管理器.js';

class TargetComponent extends EffectComponent {
  static ALLY = 'group';

  static CASTER = 'caster';

  static MAX = 'max';

  /** @type {boolean} */
  everyone;

  /** @type {boolean} */
  allies;

  /** @type {boolean} */
  self;

  getType() {
    return ComponentType.目标;
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} targets
   */
  execute(caster, level, targets) {
    const list = this.getTargets(caster, level, targets);
    return list.length > 0 && this.executeChildren(caster, level, list);
  }

  load(skill, config) {
    super.load(skill, config);

    const group = this.settings.getString(TargetComponent.ALLY, 'enemy').toLowerCase();
    this.everyone = group === 'both';
    this.allies = group === 'ally';
    this.self = this.settings.getString(TargetComponent.CASTER, 'false').toLowerCase() === 'true';
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} targets
   */
  getTargets(caster, level, targets) {
    debug.error('getTargets() must be implemented by subclass');
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} from
   * @param {Function<实体, 实体[]>} conversion
   */
  determineTargets(caster, level, from, conversion) {
    const max = this.parseValues(caster, TargetComponent.MAX, level, 99);
    const list = [];
    if (max <= 0) {
      debug.error(`${this.skill.name}, max targets must be greater than 0`);
      return list;
    }
    for (let i = 0; i < from.length; i++) {
      const target = from[i];
      const found = conversion(target);
      const count = list.length;
      for (let j = 0; j < found.length; j++) {
        const entity = found[j];
        if (this.isValidTarget(caster, target, entity)) {
          list.push(entity);
          if (list.length - count >= max) {
            break;
          }
        }
      }
    }
    if (this.self) {
      list.push(caster);
    }

    return list;
  }

  isValidTarget(caster, from, target) {
    return (
      target !== caster && (this.everyone || this.allies === 战斗管理器.isAlly(caster, target))
    );
  }
}

export default TargetComponent;
