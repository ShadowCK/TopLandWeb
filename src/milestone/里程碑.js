import 敌人 from '../combat/敌人.js';
import { combatEvents, EventType } from '../events/事件管理器.js';

const 里程碑追踪器 = {
  // 添加更多的里程碑信息
  击杀敌人: {
    老鼠: 0,
  },
  // 部分里程碑信息来自其他模块
};

const registerEvents = () => {
  combatEvents.on(EventType.实体死亡, ({ entity }) => {
    if (entity instanceof 敌人) {
      const { name } = entity.config;
      if (里程碑追踪器.击杀敌人[name] != null) {
        里程碑追踪器.击杀敌人[name] += 1;
      } else {
        里程碑追踪器.击杀敌人[name] = 1;
      }
    }
  });
};
