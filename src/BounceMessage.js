import { getPositionData } from './htmlHelper.js';
import { randomCoordinate } from './utils.js';

class BounceMessage {
  element;

  timeLeft;

  gravity;

  isRemoving = false;

  isRemoved = false;

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
    this.velocity = {
      x: (randomCoordinate(0.2, 1) * velocityScale * 0.5 * posData.width) / duration,
      y: -Math.abs((0.2 + Math.random() * 0.8) * velocityScale * 0.5 * posData.height) / duration,
    };
    // vy+0.5*g*t^2 = 0.5*parent's height，gravityFactor为1时，最终掉落到parent底部
    this.gravity = gravityFactor * ((0.5 * posData.height - this.velocity.y) / 0.5 / duration ** 2);
    $div.css({
      position: 'absolute',
      'z-index': 1000,
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
    if (!this.isRemoving) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.isRemoving = true;
        this.element.fadeOut(500, () => {
          this.element.remove();
          this.isRemoving = false;
          this.isRemoved = true;
        });
      }
    }
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
