class 实体技能 {
  /** @type {技能} */
  skill;

  /** @type {实体} */
  entity;

  /** @type {Number} */
  cooldown;

  /** @type {Number} */
  level;

  /**
   * @param {实体} entity
   * @param {技能} skill
   */
  constructor(entity, skill) {
    this.entity = entity;
    this.skill = skill;
  }

  getData() {
    return this.skill;
  }

  getManaCost() {
    return this.skill.getManaCost(this.level);
  }

  getCooldown() {
    return this.skill.getCooldown(this.level);
  }

  getLevelReq() {
    return this.skill.getLevelReq(this.level);
  }

  isOnCooldown() {
    return this.cooldown > performance.now();
  }

  isMaxed() {
    return this.level >= this.skill.maxLevel();
  }

  setLevel(level) {
    this.level = level;
  }

  addLevels(amount) {
    this.level = Math.min(this.level + amount, this.skill.maxLevel);
  }

  startCooldown() {
    this.cooldown = performance.now() + this.skill.getCooldown(this.level) * 1000;
  }

  refreshCooldown() {
    this.cooldown = 0;
  }

  addCooldown(seconds) {
    if (this.isOnCooldown()) {
      this.cooldown += seconds * 1000;
    } else {
      this.cooldown = performance.now() + seconds * 1000;
    }
  }

  subtractCooldown(seconds) {
    this.addCooldown(-seconds);
  }
}

export default 实体技能;
