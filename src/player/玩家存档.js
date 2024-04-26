import LZString from 'lz-string';
import _ from 'lodash';
import 职业 from '../classes/职业.js';
import 装备 from '../items/装备.js';
import { genEquipments } from '../htmlHelper.js';

class 玩家存档 {
  /** @type {import('./玩家.js').default} */
  player = null;

  data = null;

  constructor(player, defaultSaveData) {
    this.player = player;
    this.读档(defaultSaveData);
  }

  打包存档数据() {
    const needed = _.pick(
      this.player,
      // 玩家属性
      '背包',
      '金钱',
      '最高专精等级',
      '专精等级',
      // 实体属性
      '魔典',
      '装备',
      '职业',
      // '技能', // 技能不需要存档
    );
    needed.职业 = needed.职业.toSaveData();
    // 只保存物品的config，而不保存物品实例的额外信息。
    // 这有效防止了loadSavedItems时用物品作为config创建新物品，会叠加一层config（item.config = itemConfig）的问题。
    needed.背包 = needed.背包.items.map((item) => {
      delete item.config.config; // 删掉以前老存档里嵌套的config
      return item.config;
    });
    // 同理
    needed.装备 = _.mapValues(needed.装备, (equipments) =>
      equipments.map((e) => {
        delete e.config.config; // 删掉以前老存档里嵌套的config
        return e.config;
      }),
    );
    return JSON.stringify(needed);
  }

  存档() {
    const compressed = LZString.compress(this.打包存档数据());
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
      const rest = _.omit(this.data, '职业', '背包', '装备');
      Object.assign(player, rest);
      // 用读取的装备信息为玩家设置装备
      if (this.data.装备) {
        console.log('存档-装备', this.data.装备);
        _.forEach(this.data.装备, (typeEquipments, key) => {
          player.装备[key] = typeEquipments.map((e) => new 装备(e));
        });
        genEquipments();
      }
      // 将存档里背包的内容添加到玩家背包
      if (this.data.背包) {
        console.log('存档-背包', this.data.背包);
        player.背包.loadSavedItems(this.data.背包);
      }
      // 用读取的职业信息为玩家设置职业
      if (this.data.职业) {
        player.设置职业(new 职业(this.data.职业));
      } else {
        console.error('玩家存档或默认存档中没有职业信息，无法为玩家设置职业。');
        // 设置职业会更新玩家属性，所以只有没有职业信息时才更新。理论上玩家不可能没有职业，因为默认存档里有职业信息，除非传入的默认存档有问题。
        player.updateStats();
      }

      console.log('玩家存档已应用', player);
    } catch (error) {
      console.error('应用存档失败', error);
    }
  }
}

export default 玩家存档;
