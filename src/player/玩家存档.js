import * as LZString from 'lz-string';
import _ from 'lodash';
import { getPlayer } from './玩家管理器.js';
import 职业 from '../classes/职业.js';

class 玩家存档 {
  最高专精等级 = 0;

  /** @type{{[专精名:string]:number}} */
  专精等级 = {};

  /** @type {import('../classes/职业').default} */
  职业 = null;

  constructor(data) {
    if (data === undefined) {
      throw new Error('玩家存档数据不能为空。请提供一个默认值。');
    }
    // 允许显式创造空对象
    if (data === null) {
      return;
    }
    // 这里没有使用JSON.parse(JSON.stringify(data))
    // 创建deep copy是安全的，因为data不会被其他地方引用
    Object.assign(this, data);
  }

  存档() {
    // ! 清除parent，防止循环引用。而且parent不需要存档
    _.set(this, '职业.parent', null);
    const compressed = LZString.compress(JSON.stringify(this));
    localStorage.setItem('玩家存档', compressed);
  }

  /**
   * 通常情况下，每次读档后都要应用存档数据
   */
  应用存档() {
    const player = getPlayer();
    player.玩家存档 = this;
    // this.职业可能是普通对象(classConfig)，不能直接player.职业=this.职业。
    // 需要使用this.职业作为模板创建新职业并更新this.职业的引用
    player.设置职业(new 职业(this.职业));
    this.职业 = player.职业;
  }

  static 拥有存档() {
    return localStorage.getItem('玩家存档') !== null;
  }

  static 读档(defaultSaveData) {
    if (this.拥有存档()) {
      const decompressd = LZString.decompress(localStorage.getItem('玩家存档'));
      const data = JSON.parse(decompressd);
      console.log('读档成功', data);
      return new 玩家存档(data);
    }
    // 如果没有存档，使用默认存档信息
    return new 玩家存档(defaultSaveData);
  }
}

export default 玩家存档;
