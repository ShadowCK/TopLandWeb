import 实体 from './实体.js';

class 玩家 extends 实体 {
  constructor(params) {
    super();

    const { 职业 } = params;
    
    // 应用职业属性

    // 更新玩家的属性

    this.生命值 = this.getStat('生命值', false);
    this.魔法值 = this.getStat('魔法值', false);
  }
}
