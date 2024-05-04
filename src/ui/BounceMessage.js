import _ from 'lodash';
import { getPositionData } from '../htmlHelper.js';
import { randomCoordinate } from '../utils.js';

class BounceMessage {
  element;

  timeLeft;

  gravity;

  isRemoving = false;

  isRemoved = false;

  static fadeOutTime = 0.5; // seconds

  constructor({
    parent,
    messageHTML,
    className,
    duration = 1,
    gravityFactor = 1,
    velocityScale = 1,
    offset = { x: 0, y: 0 },
  }) {
    // 必须先添加到DOM，否则无法获取宽高
    const $div = $(`<div class="ui text">${messageHTML}</div>`).appendTo('body');
    this.element = $div;
    this.timeLeft = duration;
    const posData = getPositionData(parent);
    this.posData = posData;
    const trueDuration = duration + BounceMessage.fadeOutTime;
    this.velocity = {
      x: (randomCoordinate(0.2, 1) * velocityScale * 0.5 * posData.width) / trueDuration,
      y: -(_.random(0.2, 1) * velocityScale * 0.5 * posData.height) / trueDuration,
    };
    // vy+0.5*g*t^2 = 0.5*父元素高度，gravityFactor为1且没有y轴偏移时，最终掉落到parent底部
    const baseGravity = (0.5 * posData.height - this.velocity.y) / 0.5 / trueDuration ** 2;
    // gravityFactor不应该作为重力加速度的乘数，而表示应该行进多少倍的h（即0.5*父元素高度）
    // 由于vy+0.5gt^2=x，重力系数为2时，只有在vy为0时，位移刚好为2倍。也就是说vy+0.5kgt^2≠2x 我们需要进行调整，获得真正的重力系数。
    // ∵ vy + (F(k) * gt^2 / 2) = kh ∴ F(k) = (kh - vy) * 2 / (gt^2)
    const trueGravityFactor =
      ((gravityFactor * 0.5 * posData.height - this.velocity.y) * 2) /
      (baseGravity * trueDuration ** 2);
    this.gravity = trueGravityFactor * baseGravity;
    $div.css({
      position: 'absolute',
      'z-index': 1000,
      'user-select': 'none',
    });
    // 必须先设置absolute，否则宽高不是实际尺寸（div的默认宽度是100%，占满一行，高度还可能被其他元素影响）
    this.x = posData.centerX - $div.width() / 2 + posData.height * offset.x;
    this.y = posData.centerY - $div.height() / 2 + posData.height * offset.y;
    // 初始化位置
    this.update(0);
    $div.addClass('bounce-message');
    if (className) {
      $div.addClass(className);
    }
  }

  update(dt) {
    if (this.isRemoved) {
      return;
    }
    // 减少剩余时间，到0后淡出
    if (!this.isRemoving) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.isRemoving = true;
        this.element.fadeOut(BounceMessage.fadeOutTime * 1000, () => {
          this.element.remove();
          this.isRemoving = false;
          this.isRemoved = true;
        });
      }
    }
    // 淡出时仍会移动
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
    this.velocity.y += this.gravity * dt;
    this.element.css({
      left: `${this.x}px`,
      top: `${this.y}px`,
    });
  }
}

export default BounceMessage;
