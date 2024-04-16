import EventEmitter from 'eventemitter3';

const combatEvents = new EventEmitter();

const generalEvents = new EventEmitter();

export { combatEvents, generalEvents };
