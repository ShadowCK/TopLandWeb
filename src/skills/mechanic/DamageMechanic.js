import { StatType } from '../../combat/战斗属性.js';
import { skillDamage } from '../../combat/战斗管理器.js';
import MechanicComponent from './MechanicComponent.js';

class DamageMechanic extends MechanicComponent {
  static #TYPE = 'type';

  static #DAMAGE = 'damage';

  static #DAMAGE_TYPE = 'damage-type';

  getKey() {
    return 'damage';
  }

  /**
   * @param {实体} caster
   * @param {Number} level
   * @param {实体[]} targets
   * @returns
   */
  execute(caster, level, targets) {
    const pString = this.settings.getString(DamageMechanic.#TYPE, 'damage').toLowerCase();
    const percent = pString === 'multiplier' || pString === 'percent';
    const missing = pString === 'percent missing';
    const left = pString === 'percent left';
    const damage = this.parseValues(caster, DamageMechanic.#DAMAGE, level, 1.0);
    const damageType = this.settings.getString(DamageMechanic.#DAMAGE_TYPE, '奥术');
    // TODO: 伤害小于0，可能会被Buff修正为正数，不应该直接返回false
    if (damage < 0) {
      return false;
    }
    targets.forEach((target) => {
      if (target.isDead) {
        return;
      }
      let amount = damage;
      if (percent) {
        amount = (damage * target.getStat2(StatType.最大生命值)) / 100;
      } else if (missing) {
        amount = (damage * (target.getStat2(StatType.最大生命值) - target.生命值)) / 100;
      } else if (left) {
        amount = (damage * target.生命值) / 100;
      }
      skillDamage({
        damager: caster,
        damaged: target,
        damage: amount,
        damageType,
      });
    });
    return targets.length > 0;
  }
}

export default DamageMechanic;
