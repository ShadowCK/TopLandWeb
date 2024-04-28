type 物品 = import('../src/items/物品').default;
type 装备 = import('../src/items/装备').default;
type 实体 = import('../src/combat/实体').default;
type 玩家 = import('../src/player/玩家').default;
type 技能 = import('../src/skills/技能').default;
type 实体技能 = import('../src/skills/实体技能').default;
type 职业 = import('../src/classes/职业').default;
type 战斗区域 = import('../src/combat/战斗区域').战斗区域;
type EffectComponent = import('../src/skills/EffectComponent').default;
type TriggerHandler = import('../src/skills/triggerHandler').default;
type TriggerComponent = import('../src/skills/trigger/TriggerComponent').default;
type Trigger = import('../src/skills/trigger/Trigger').default;
type Settings = import('../src/skills/Settings').default;
type EventEmitter = import('eventemitter3').EventEmitter;

// globals.d.ts
declare const WEBPACK_MODE: string;
declare const VERSION: string;
