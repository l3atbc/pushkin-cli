#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const WorkerManager = require('../src/workerManager');
const ControllerManager = require('../src/controllerManager');
const DbItemsManager = require('../src/dbItemsManager');

program.parse(process.argv);

const thing = program.args[0];
const name = program.args[1];
if (thing && name) {
  console.log(chalk.blue('generating a new ' + thing + ' named ' + name)); // eslint-disable-line no-console
  switch (thing) {
    case 'controller': {
      const controllerManager = new ControllerManager();
      if (controllerManager.conflict(name)){
        console.log(chalk.red('a controller already exists with the specified name'));
        break;
      }
      else {
        controllerManager.generate(name);
        break;
      }
    }
    case 'dbItems': {
      const dbItemsManager = new DbItemsManager();
      if (dbItemsManager.modelsConflict(name)) {
        console.log(chalk.red('models already exist with the specified name'));
        break;
      }
      else if (dbItemsManager.migrationsConflict(name)) {
        console.log(chalk.red('migrations already exist with the specified name'));
        break;
      }
      else if (dbItemsManager.seedsConflict(name)) {
        console.log(chalk.red('seeds already exist with the specified name'));
        break;
      }
      else {
        dbItemsManager.generate(name);
      }
      break;
    }
    case 'worker': {
      const workerManager = new WorkerManager();
      if (workerManager.conflict(name)){
        console.log(chalk.red('a worker already exists with the specified name'));
        break;
      }
      else {
        workerManager.generate(name);
      }
      break;
    }
    default:
      console.log('please input a command'); // eslint-disable-line no-console
  }
} else {
  console.log(chalk.red('missing entity or name')); // eslint-disable-line no-console
}
