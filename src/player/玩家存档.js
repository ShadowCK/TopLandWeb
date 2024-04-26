import LZString from 'lz-string';
import _ from 'lodash';
import 职业 from '../classes/职业.js';
import 装备 from '../items/装备.js';
import { genEquipments } from '../htmlHelper.js';
import { equipConfigs } from '../items/装备信息.js';
import { itemConfigs } from '../items/物品信息.js';

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
    // TODO: 和下面一样，toSaveData只保存名称等必要信息。
    needed.职业 = needed.职业.toSaveData();
    // 只保存名称、种类等必要内容（如品阶，等级，稀有度），不保存具体内容
    // TODO: 和上面一样，给物品添加toSaveData，只保存必要信息。
    needed.背包 = needed.背包.items.map((item) => _.pick(item, 'name', 'type'));
    needed.装备 = _.mapValues(needed.装备, (equipments) =>
      equipments.map((e) => _.pick(e, 'name', 'type')),
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
        // 由于只保存了必要信息，需要获取对应装备名的装备配置，而不是像以前一样用将该装备数据作为config
        // 需要注意的是，如果配置文件里没有该装备（比如历史遗留导致的绝版装备，不再在配置列表里），玩家会丢失该装备。
        // TODO：应该给玩家一一装上，而不是假设玩家可以穿存档里的装备
        _.forEach(this.data.装备, (typeEquipments, key) => {
          player.装备[key] = _.map(typeEquipments, (data) => equipConfigs[data.name])
            .filter((config) => config != null)
            .map((config) => new 装备(config));
        });
        genEquipments();
      }
      // 将存档里背包的内容添加到玩家背包
      if (this.data.背包) {
        console.log('存档-背包', this.data.背包);
        // 同理，只保存了必要信息，需要获取对应物品名的物品配置，而不是像以前一样用将该物品数据作为config
        const mappedItems = _.map(this.data.背包, (data) => {
          const configs = data.type === '装备' ? equipConfigs : itemConfigs;
          return configs[data.name];
        }).filter((config) => config != null);
        // TODO: 将上面的逻辑放到loadSavedItems
        player.背包.loadSavedItems(mappedItems);
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
