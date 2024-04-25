import * as math from 'mathjs';
import * as debug from '../../debug.js';
import 技能 from '../技能.js';
import MechanicComponent from './MechanicComponent.js';

class ValueStatMechanic extends MechanicComponent {
  // Settings: key, stat, calc-buff, apply-range, formula

  getKey() {
    return 'value stat';
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} targets
   * @returns
   */
  execute(caster, level, targets) {
    if (!this.settings.has('key') || !this.settings.has('stat')) {
      debug.error('ValueStatMechanic requires key and stat settings');
      return false;
    }
    const key = this.settings.getString('key');
    const statPath = this.settings.getString('stat');
    const calcBuff = this.settings.getBoolean('calc-buff', true) === true;
    const applyRange = this.settings.getBoolean('apply-range', true) === true;
    const formula = this.settings.getString('formula', 'v');
    const casterData = 技能.getCasterData(caster);
    casterData[key] = math.evaluate(formula, {
      v: targets[0].getStat2(statPath, calcBuff, applyRange),
      l: level,
    });
    return true;
  }
}

export default ValueStatMechanic;
