import { EventType, HTMLEvents } from './events/事件管理器.js';
import { GameSettingName } from './enums.js';
import { setGameSpeed, settings } from './settings.js';
import { setHTMLInterval, clearHTMLInterval } from './events/htmlHandler.js';

const registerEvents = () => {
  HTMLEvents.on(EventType.更改设置, ({ setting, value }) => {
    if (setting === GameSettingName.游戏倍速) {
      setGameSpeed(value);
    } else if (setting === GameSettingName.HTML更新间隔) {
      settings.HTML更新间隔 = value; // Can be Infinity
      if (value === Infinity) {
        clearHTMLInterval();
        return;
      }
      setHTMLInterval(value);
    }
  });
};

export default registerEvents;
export { registerEvents };
