class Trigger {
  getKey() {
    throw new Error('getKey() must be implemented by subclass');
  }

  getEvent() {
    throw new Error('getEvent() must be implemented by subclass');
  }

  /** @type {EventEmitter} */
  getEmitter() {
    throw new Error('getEmitter() must be implemented by subclass');
  }

  /**
   * @param {Object<string, any>} eventData
   * @param {Number} level
   * @param {Settings} settings
   */
  shouldTrigger(eventData, level, settings) {
    throw new Error('shouldTrigger() must be implemented by subclass');
  }

  setValues(eventData, data) {
    throw new Error('setValues() must be implemented by subclass');
  }

  getCaster(eventData) {
    throw new Error('getCaster() must be implemented by subclass');
  }

  getTarget(eventData, settings) {
    throw new Error('getTarget() must be implemented by subclass');
  }
}

export default Trigger;
