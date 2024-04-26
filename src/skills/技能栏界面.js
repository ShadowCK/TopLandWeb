import _ from 'lodash';
import * as 玩家管理器 from '../player/玩家管理器.js';
import { settings } from '../settings.js';
import { genProgressBar, updateProgressBar } from '../htmlHelper.js';

class 技能栏界面 {
  /** @type {JQuery<HTMLElement>} */
  parent = null;

  // 快速访问静态方法
  genSkillIconHTML = 技能栏界面.genSkillIconHTML;

  /**
   * @param {JQuery<HTMLElement>} parent
   */
  constructor(parent) {
    this.parent = parent;
    const element = this.parent.get(0);
    element.ui = this;
  }

  static genSkillIconHTML(name) {
    const nameHTML = name
      ? `<div style="display:flex; text-align: center; align-items: center; justify-content: center; position: absolute; width: 100%; height: 100%; top: 50%; left: 50%; transform: translate(-50%, -50%)"><span class="ui black text" style="font-size: max(1em, 15cqw)">${name}</span></div>`
      : '';
    return /* html */ `
    <div class="column">
      <div class="ui card" style="container-type: inline-size; width: 64px">
        <div class="ui image placeholder" style="animation:none; overflow: visible;">
          <div class="square icon image"></div>
          ${nameHTML}
          </div>
        </div>
      </div>
    </div>
  `;
  }

  refresh() {
    const player = 玩家管理器.getPlayer();
    this.parent.empty();
    let count = 0;
    _.some(player.技能, (skill) => {
      if (count >= settings.技能栏每行技能数量) {
        return true; // 返回 true 停止迭代
      }
      if (!skill.getData().canCast()) {
        return false;
      }
      count += 1;
      const container = $(this.genSkillIconHTML(skill.getData().name));
      const skillIcon = container.find('.ui.card');
      skillIcon.on('click', () => {
        player.cast(skill);
      });
      skillIcon.css('cursor', 'pointer');
      const 进度条容器 = $('<div class="技能图标-进度条"></div>').css({
        position: 'absolute',
        top: 0,
        width: '100%',
      });
      skillIcon.prepend(进度条容器);
      genProgressBar({
        className: 'small',
        parent: 进度条容器,
        color: 'grey',
        centered: true,
      }).attr('data-skill-key', skill.getData().key);
      this.parent.append(container);
      return false;
    });
    this.update();
  }

  update() {
    const player = 玩家管理器.getPlayer();
    this.parent.children('.column').each((index, element) => {
      const $element = $(element);
      const $progress = $element.find('.progress');
      const skillKey = $progress.attr('data-skill-key');
      if (player.hasSkill(skillKey)) {
        const cooldownLeft = player.getSkill(skillKey).cooldownLeft();
        const cooldown = player.getSkill(skillKey).getCooldown();
        updateProgressBar($progress, cooldown - cooldownLeft, cooldown, '{value}/{total}', 0, true);
        return;
      }
      // 该技能已经不存在，移除该元素
      $element.remove();
    });
  }
}

export default 技能栏界面;
