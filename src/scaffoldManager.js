/* eslint-disable no-console */
const DbItemsManager = require('./dbItemsManager');
const ControllerManager = require('./controllerManager');
const WorkerManager = require('./workerManager');

module.exports = class ScaffoldManager {
  constructor() {
    this.dbItemsManager = new DbItemsManager();
    this.controllerManager = new ControllerManager();
    this.workerManager = new WorkerManager();
  }
  workerConflict(name) {
    if (this.workerManager.conflict(name)) {
      return true;
    }
    else {
      return false;
    }    
  }
  controllerConflict(name) {
    if (this.controllerManager.conflict(name)) {
      return true;
    }
    else {
      return false;
    }    
  }
  modelsConflict(name) {
    if (this.dbItemsManager.modelsConflict(name)) {
      return true;
    }
    else {
      return false;
    }    
  }
  seedsConflict(name){
    if (this.dbItemsManager.seedsConflict(name)) {
      return true;
    }
    else {
      return false;
    }
  }
  migrationsConflict(name) {
    if (this.dbItemsManager.migrationsConflict(name)) {
      return true;
    }
    else {
      return false;
    }    
  }
  generate(name) {
    try {
      this.workerManager.generate(name);
    } catch (e) {
      this.workerManager.delete(name);
      console.error(e);
      console.log('couldn\'t generate worker');
      return;
    }
    try {
      this.dbItemsManager.generate(name);
    } catch (error) {
      this.dbItemsManager.delete(name);
      console.error(error);
      console.log('couldn\'t generate models/migrations/seeds');
      return;
    }
    try {
      this.controllerManager.generate(name);
    } catch (error) {
      this.controllerManager.delete(name);
      console.error(error);
      console.log('couldn\'t generate controller');
      return;
    }
  }
};
