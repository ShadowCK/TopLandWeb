import { getPlayer } from '../player/玩家管理器';

const 转生 = () => {
  const player = getPlayer();
  const { 职业 } = player;
  const { name, maxLevel } = 职业;
};
