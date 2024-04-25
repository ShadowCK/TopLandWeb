type 物品 = import('../src/items/物品').default;
type 实体 = import('../src/combat/实体').default;
type 玩家 = import('../src/player/玩家').default;
type 技能 = import('../src/skills/技能').default;
type 实体技能 = import('../src/skills/实体技能').default;
type EffectComponent = import('../src/skills/EffectComponent').default;
type TriggerHandler = import('../src/skills/triggerHandler').default;
type TriggerComponent = import('../src/skills/trigger/TriggerComponent').default;
type Trigger = import('../src/skills/trigger/Trigger').default;
type Settings = import('../src/skills/Settings').default;
type EventEmitter = import('eventemitter3').EventEmitter;

// globals.d.ts
declare const WEBPACK_MODE: string;
declare const VERSION: string;
