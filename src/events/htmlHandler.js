import { changeTab, genCombatLayout, genInventory } from '../htmlHelper.js';
import { getPlayer } from '../player/玩家管理器.js';
import { generalEvents, combatEvents, EventType } from './事件管理器.js';

// 清除实体在战斗面板的显示
const clearEntityInCombatTab = (entity) => {
  const 战斗面板实体列表 = $('#战斗面板-实体列表');
  战斗面板实体列表.find(`#${entity.uuid}`).remove();
};

const registerEvents = () => {
  combatEvents.on(EventType.实体死亡, ({ entity }) => {
    if (entity !== getPlayer()) {
      return;
    }
    $.toast({
      displayTime: 2000,
      class: 'error chinese',
      showProgress: 'bottom',
      title: '你死了！',
      message: `真是个菜鸡`,
    });
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
    genInventory(getPlayer().背包);
  });

  generalEvents.on(EventType.失去物品, (_itemConfig) => {
    // 无脑刷新背包……
    genInventory(getPlayer().背包);
  });
};

export default registerEvents;
