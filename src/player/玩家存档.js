import LZString from 'lz-string';
import _ from 'lodash';
import 职业 from '../classes/职业.js';
import 装备 from '../items/装备.js';
import { genEquipments } from '../htmlHelper.js';
import { equipConfigs } from '../items/装备信息.js';
import { itemConfigs } from '../items/物品信息.js';
import { ItemType } from '../enums.js';
import { Buff } from '../combat/Buff.js';
import * as debug from '../debug.js';
import { settings } from '../settings.js';
import { 所有战斗区域 } from '../combat/战斗管理器.js';

const 物品存档数据 = ['name', 'type', 'stack'];
const 装备存档数据 = ['name', 'type', 'stack', '品阶', '品质', '合成次数'];

class 玩家存档 {
  /** @type {玩家} */
  player = null;

  data = null;

  constructor(player, defaultSaveData) {
    this.player = player;
    this.读档(defaultSaveData);
  }

  打包存档数据() {
    // 打包需要保存的玩家数据
    const needed = _.pick(
      this.player,
      // 实体属性
      'buffs',
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
      '抽奖用专精等级',
      '金钱抽奖次数',
      '专精抽奖次数',
    );
    // TODO: 和下面一样，toSaveData只保存名称等必要信息。
    needed.职业 = needed.职业.toSaveData();
    // 只保存名称、种类等必要内容（如品阶，等级，稀有度），不保存具体内容
    // TODO: 和上面一样，给物品添加toSaveData，只保存必要信息。
    needed.背包 = needed.背包.items.map((item) => _.pick(item, 装备存档数据));
    needed.装备 = _.mapValues(needed.装备, (equipments) =>
      equipments.map((e) => _.pick(e, 装备存档数据)),
    );

    // 打包游戏设置等其他数据
    needed.游戏设置 = settings;
    needed.战斗区域 = _.mapValues(所有战斗区域, (area) => _.pick(area, ['level']));
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
      debug.error('没有玩家实例');
      return;
    }
    player.玩家存档 = this;
    if (!this.data) {
      debug.error('没有存档数据');
      return;
    }
    try {
      player.reset();
      const rest = _.omit(this.data, 'buffs', '职业', '背包', '装备', '游戏设置', '战斗区域');
      Object.assign(player, rest);
      // 还原游戏设置
      if (this.data.游戏设置) {
        Object.assign(settings, this.data.游戏设置);
      }
      // 还原战斗区域信息
      if (this.data.战斗区域) {
        _.forEach(this.data.战斗区域, (areaData, key) => {
          const area = 所有战斗区域[key];
          if (area) {
            area.setLevel(areaData.level);
          }
        });
      }
      // 还原存档里的buff信息
      if (this.data.buffs) {
        debug.log('存档-buffs', this.data.buffs);
        // 逐个添加 buff
        _.forEach(this.data.buffs, (typeBuffs) => {
          typeBuffs.forEach((buffData) => {
            player.addBuff(new Buff(buffData));
          });
        });
      }
      // 用读取的装备信息为玩家设置装备
      if (this.data.装备) {
        debug.log('存档-装备', this.data.装备);
        // 由于只保存了必要信息，需要获取对应装备名的装备配置，而不是像以前一样用将该装备数据作为config
        // 需要注意的是，如果配置文件里没有该装备（比如历史遗留导致的绝版装备，不再在配置列表里），玩家会丢失该装备。
        // TODO：应该给玩家一一装上，而不是假设玩家可以穿存档里的装备
        _.forEach(this.data.装备, (typeEquipments, key) => {
          player.装备[key] = _.map(typeEquipments, (data) => {
            const config = equipConfigs[data.name];
            if (config == null) {
              return null;
            }
            return _.merge(_.cloneDeep(config), _.pick(data, 装备存档数据));
          })
            .filter((config) => config != null)
            .map((config) => new 装备(config));
        });
        genEquipments();
      }
      // 将存档里背包的内容添加到玩家背包
      if (this.data.背包) {
        debug.log('存档-背包', this.data.背包);
        // 同理，只保存了必要信息，需要获取对应物品名的物品配置，而不是像以前一样用将该物品数据作为config
        const mappedItems = _.map(this.data.背包, (data) => {
          const configs = data.type === ItemType.装备 ? equipConfigs : itemConfigs;
          const config = _.cloneDeep(configs[data.name]);
          return _.merge(
            config,
            _.pick(data, data.type === ItemType.装备 ? 装备存档数据 : 物品存档数据),
          );
        }).filter((config) => config != null);
        // TODO: 将上面的逻辑放到loadSavedItems
        player.背包.loadSavedItems(mappedItems);
      }
      // 用读取的职业信息为玩家设置职业
      if (this.data.职业) {
        player.设置职业(new 职业(this.data.职业));
      } else {
        debug.error('玩家存档或默认存档中没有职业信息，无法为玩家设置职业。');
        // 设置职业会更新玩家属性，所以只有没有职业信息时才更新。理论上玩家不可能没有职业，因为默认存档里有职业信息，除非传入的默认存档有问题。
        player.updateStats();
      }

      debug.log('玩家存档已应用', player);
    } catch (error) {
      debug.error('应用存档失败', error);
    }
  }
}

export { 玩家存档, 物品存档数据, 装备存档数据 };
