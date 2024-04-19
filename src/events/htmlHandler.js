import { changeTab, genCombatLayout, genEquipments, genInventory } from '../htmlHelper.js';
import { getPlayer } from '../player/玩家管理器.js';
import { generalEvents, combatEvents, EventType } from './事件管理器.js';

// 清除实体在战斗面板的显示
const clearEntityInCombatTab = (entity) => {
  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  战斗面板实体列表.find(`#${entity.uuid}`).remove();
};

let isUserOnPage = true;
let isDeathPopupVisible = false;

$(document).on('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    isUserOnPage = true;
  } else if (document.visibilityState === 'hidden') {
    isUserOnPage = false;
  }
});

const registerEvents = () => {
  combatEvents.on(EventType.实体死亡, ({ entity }) => {
    if (entity !== getPlayer()) {
      return;
    }
    if (isUserOnPage) {
      $.toast({
        title: '你死了！',
        message: `真是个菜鸡。`,
        class: 'error chinese',
        displayTime: 2000,
        showProgress: 'bottom',
      });
    } else if (!isDeathPopupVisible) {
      // 页面在后台时死亡，永久显示popup。直到点掉，不会再生成新的死亡提示，防止每次死亡弹出一个需要手动点掉的提示。
      $.toast({
        title: '你在不知不觉的时候死了！',
        message: `试试换个区域挂机吧。`,
        class: 'black chinese',
        displayTime: 0,
        onShow: () => {
          isDeathPopupVisible = true;
        },
        onHidden: () => {
          isDeathPopupVisible = false;
        },
      });
    }
    changeTab('角色面板');
  });

  combatEvents.on(EventType.生成实体, ({ entity, isCancelled, config }) => {
    if (isCancelled) {
      return;
    }
    genCombatLayout(entity, $('#战斗面板-实体列表'), { config });
  });

  combatEvents.on(EventType.移除实体, ({ entity }) => {
    clearEntityInCombatTab(entity);
  });

  generalEvents.on(EventType.获得物品, (_itemConfig) => {
    // 无脑刷新背包……
    console.log('获得物品，刷新背包');
    genInventory();
  });

  generalEvents.on(EventType.失去物品, (_itemConfig) => {
    // 无脑刷新背包……
    console.log('失去物品，刷新背包');
    genInventory();
  });

  generalEvents.on(EventType.穿上装备, ({ entity, _equipment }) => {
    if (entity !== getPlayer()) {
      return;
    }
    // 无脑刷新！太无脑了！
    genInventory();
    genEquipments();
  });

  generalEvents.on(EventType.脱下装备, ({ entity, _equipment }) => {
    if (entity !== getPlayer()) {
      return;
    }
    // 无脑刷新！太无脑了！
    genInventory();
    genEquipments();
  });
};

export default registerEvents;
