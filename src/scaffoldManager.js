/* eslint-disable no-console */
const ModelManager = require('./modelManager');
const ControllerManager = require('./controllerManager');
const WorkerManager = require('./workerManager');

module.exports = class ScaffoldManager {
  constructor() {
    this.modelManager = new ModelManager();
    this.controllerManager = new ControllerManager();
    this.workerManager = new WorkerManager();
  }
  generate(name) {
    try {
      this.workerManager.generate(name);
    } catch (e) {
      console.error(e);
      console.log('Couldnt generate workers');
      return;
    }
    try {
      this.modelManager.generate(name);
    } catch (error) {
      console.error(error);
      console.log('Couldnt generate models');
      return;
    }
    try {
      this.controllerManager.generate(name);
    } catch (error) {
      console.error(error);
      console.log('Couldnt generate models');
      return;
    }
  }
};
