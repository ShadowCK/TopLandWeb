/* eslint-disable import/no-cycle */
/** @type {Object<string, Object<string, Function>} */
const components = {};

/** @type {Object<string, Trigger>} */
const triggers = {};

/** @type {Map<Trigger, Function>} */
const listeners = new Map();

/**
 * @param {string} key
 * @returns {Trigger}
 */
const getTrigger = (key) => triggers[key.toUpperCase().replace(/ /g, '_')];

/**
 * @param {string} type Component type
 * @param {string} key Component key
 */
const getComponent = (type, key) => {
  const constructor = components[type][key.toLowerCase()];
  if (!constructor) {
    throw new Error(`Component ${type}.${key} not found.`);
  }
  try {
    return new constructor();
  } catch (error) {
    throw new Error(`Error creating component ${type}.${key}: ${error.message}`);
  }
};

/**
 * @param {Trigger} trigger
 * @returns {Function} listener
 */
const getListener = (trigger) => listeners.get(trigger);

/**
 * @param {Trigger} trigger
 */
const registerTrigger = (trigger) => {
  if (getTrigger(trigger.getKey()) != null) {
    throw new Error(`Trigger ${trigger.getKey()} already registered.`);
  } else if (trigger.getKey().includes('-')) {
    throw new Error(`Trigger ${trigger.getKey()} must not contain dashes.`);
  }

  triggers[trigger.getKey()] = trigger;
  listeners.set(trigger, (listener, eventData) => listener.apply(eventData, trigger));
};

/**
 * @param {EffectComponent} component
 */
const register = (component) => {
  const componentType = component.getType();
  let stored = components[componentType];
  if (!stored) {
    stored = {};
    components[componentType] = stored;
  }
  stored[component.getKey().toLowerCase()] = component.constructor;
};

const registerComponents = async () => {
  const { default: FirstTarget } = await import('./target/FirstTarget.js');
  const { default: DamageMechanic } = await import('./mechanic/DamageMechanic.js');
  const { default: ValueStatMechanic } = await import('./mechanic/ValueStatMechanic.js');

  // Triggers

  // TARGETS
  register(new FirstTarget());

  // CONDITIONS

  // Mechanics
  register(new DamageMechanic());
  register(new ValueStatMechanic());
};

export { getTrigger, registerComponents, getComponent, getListener };
