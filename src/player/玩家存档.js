import * as LZString from 'lz-string';
import _ from 'lodash';
import 职业 from '../classes/职业.js';
import 装备 from '../items/装备.js';

class 玩家存档 {
  /** @type {import('./玩家.js').default} */
  player = null;

  data = null;

  constructor(player, defaultSaveData) {
    this.player = player;
    this.读档(defaultSaveData);
  }

  存档() {
    const needed = _.pick(
      this.player,
      '职业',
      // 玩家属性
      '背包',
      '金钱',
      '最高专精等级',
      '专精等级',
      // 实体属性
      '魔典',
      '装备',
      '技能',
      '职业',
    );
    needed.职业 = needed.职业.toSaveData();
    needed.背包 = needed.背包.items;
    const compressed = LZString.compress(JSON.stringify(needed));
    localStorage.setItem('玩家存档', compressed);
  }

  读档(defaultSaveData) {
    const save = localStorage.getItem('玩家存档');
    if (save !== null) {
      const decompressd = LZString.decompress(save);
      const data = JSON.parse(decompressd);
      this.data = data;
    } else {
      this.data = defaultSaveData;
    }
    console.log('读取本地存档', this.data);
    return this;
  }

  /**
   * 创建存档会自动读档，但是为了代码的灵活性，要手动应用存档。
   * @param {import('./玩家.js').default} player
   */
  应用存档() {
    const { player } = this;
    if (!player) {
      console.error('没有玩家实例');
      return;
    }
    player.玩家存档 = this;
    if (!this.data) {
      console.error('没有存档数据');
      return;
    }
    try {
      // 用读取的职业信息为玩家设置职业
      if (this.data.职业) {
        player.设置职业(new 职业(this.data.职业));
      }
      // 将存档里背包的内容添加到玩家背包
      if (this.data.背包) {
        console.log('存档-背包', this.data.背包);
        player.背包.loadSavedItems(this.data.背包);
      }
      if (this.data.装备) {
        console.log('存档-装备', this.data.装备);
        _.forEach(this.data.装备, (typeEquipments, key) => {
          player.装备[key] = typeEquipments.map((e) => new 装备(e));
        });
      }
      const rest = _.omit(this.data, '职业', '背包', '装备');
      Object.assign(player, rest);
      console.log('玩家存档已应用', player);
    } catch (error) {
      console.error('应用存档失败', error);
    }
  }
}

export default 玩家存档;
