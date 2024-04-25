import TargetComponent from './TargetComponent.js';
import * as 战斗管理器 from '../../combat/战斗管理器.js';

class FirstTarget extends TargetComponent {
  getKey() {
    return 'first';
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} targets
   */
  getTargets(caster, level, targets) {
    return this.determineTargets(caster, level, targets, (target) => {
      const result = 战斗管理器.getTarget(target);
      return result ? [result] : [];
    });
  }
}

export default FirstTarget;
