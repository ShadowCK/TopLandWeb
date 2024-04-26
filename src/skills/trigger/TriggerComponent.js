import { ComponentType } from '../../enums.js';
import EffectComponent from '../EffectComponent.js';

class TriggerComponent extends EffectComponent {
  #running = false;

  isRunning() {
    return this.#running;
  }

  /**
   * @param {实体} caster
   * @param {实体} target
   * @param {number} level
   */
  trigger(caster, target, level) {
    return this.execute(caster, level, [target]);
  }

  getKey() {
    return 'trigger';
  }

  getType() {
    return ComponentType.触发;
  }

  execute(caster, level, targets) {
    try {
      this.#running = true;
      return this.executeChildren(caster, level, targets);
    } finally {
      this.#running = false;
    }
  }
}

export default TriggerComponent;
