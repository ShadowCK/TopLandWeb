type 抽奖信息 = {
  success: boolean;
  useExpertise: boolean;
  isFlatBuff: boolean;
  player: 玩家;
  times: number;
  resource: number;
  cost: number;
};

type 抽奖奖励 = {
  statType: string;
  value: number;
  base: number;
  baseMult: number;
  qualityMult: number;
  type: string;
  priority: number;
};
