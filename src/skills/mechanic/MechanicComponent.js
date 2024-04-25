import { ComponentType } from '../../enums.js';
import EffectComponent from '../EffectComponent.js';

class MechanicComponent extends EffectComponent {
  getType() {
    return ComponentType.效果;
  }
}

export default MechanicComponent;
