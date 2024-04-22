import BounceMessage from './BounceMessage.js';
import { getCombatLayout } from './htmlHelper.js';

/** @type {import('./BounceMessage.js').default} */
const messages = [];

const 生成伤害信息 = ({
  damaged,
  damage,
  damageType,
  className,
  duration = 1,
  gravityFactor = 1,
  velocityScale = 1,
  offset,
}) => {
  const combatLayout = getCombatLayout($('#战斗面板-实体列表'), damaged);
  // 实体可能已经死亡并且战斗UI被移除。
  if (!combatLayout) {
    return;
  }
  const messageHTML = `<span class="ui red text">-${damage}</span> ${damageType}`;
  messages.push(
    new BounceMessage({
      parent: combatLayout,
      messageHTML,
      className: className ? `${className} chinese` : 'chinese',
      duration,
      gravityFactor,
      velocityScale,
      offset,
    }),
  );
};

const 生成治疗信息 = ({
  healed,
  healing,
  className,
  duration = 1,
  gravityFactor = 1,
  velocityScale = 1,
  offset,
}) => {
  const combatLayout = getCombatLayout($('#战斗面板-实体列表'), healed);
  // 实体可能已经死亡并且战斗UI被移除。
  if (!combatLayout) {
    return;
  }
  const messageHTML = `<span class="ui green text">+${healing}`;
  messages.push(
    new BounceMessage({
      parent: combatLayout,
      messageHTML,
      className: className ? `${className} chinese` : 'chinese',
      duration,
      gravityFactor,
      velocityScale,
      offset,
    }),
  );
};

const update = (dt) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].isRemoved) {
      messages.splice(i, 1);
    } else {
      messages[i].update(dt);
    }
  }
};

export { update, 生成伤害信息, 生成治疗信息 };
