import * as LZString from 'lz-string';
import _ from 'lodash';
import 职业 from '../classes/职业.js';

class 玩家存档 {
  /** @type {import('./玩家.js').default} */
  player = null;

  constructor(player, data) {
    if (data === undefined) {
      throw new Error('玩家存档数据不能为空。请提供一个默认值。');
    }
    this.player = player;
    // 如果没有存档数据，使用默认数据
    if (data === null) {
      return;
    }
    // data不会被其他地方引用，不需要深拷贝
    Object.assign(this, data);
  }

  存档() {
    const needed = _.omit(this.player, ['玩家存档'], ['职业']);
    const data = {
      职业: new 职业(this.player.职业), // 去除parent, 防止被修改
      ...needed,
    };
    const compressed = LZString.compress(JSON.stringify(data));
    localStorage.setItem('玩家存档', compressed);
  }

  /**
   * 通常情况下，每次读档后都要应用存档数据
   */
  应用存档(player) {
    player.玩家存档 = this;
    // this.职业可能是普通对象(classConfig)，不能直接player.职业=this.职业。
    // 需要使用this.职业作为模板创建新职业并更新this.职业的引用
    player.设置职业(new 职业(this.职业));
    this.职业 = player.职业;
  }

  static 拥有存档() {
    return localStorage.getItem('玩家存档') !== null;
  }

  读档(defaultSaveData) {
    debugger;
    if (this.拥有存档()) {
      const decompressd = LZString.decompress(localStorage.getItem('玩家存档'));
      const data = JSON.parse(decompressd);
      console.log('读档成功', data);
      return new 玩家存档(this.player, data);
    }
    // 如果没有存档，使用默认存档信息
    return new 玩家存档(this.player, defaultSaveData);
  }
}

export default 玩家存档;
