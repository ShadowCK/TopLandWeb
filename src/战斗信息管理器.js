import _ from 'lodash';
import BounceMessage from './ui/BounceMessage.js';
import { getCombatLayout } from './htmlHelper.js';

/** @type {BounceMessage[]} */
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
  isBlocked,
  blockRate,
  isCrit,
  isDodged,
}) => {
  const combatLayout = getCombatLayout($('#战斗面板-实体列表'), damaged);
  // 实体可能已经死亡并且战斗UI被移除。
  if (!combatLayout) {
    return;
  }
  const shieldIcon = '<i class="shield alternate icon" style="margin:0"></i>';
  const messageHTML = isDodged
    ? `<span class="ui grey text"><i class="eye slash outline icon"></i></span>`
    : `<span class="ui red text">-${damage}</span> ${damageType}${
        isCrit
          ? '<span class="ui red text"><i class="exclamation icon" style="margin:0"></i></span>'
          : ''
      }${
        isBlocked ? `<span class="ui brown text">${shieldIcon}${_.round(blockRate)}%</span>` : ''
      }`;
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
