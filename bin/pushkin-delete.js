#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const WorkerManager = require('../src/workerManager');
const ControllerManager = require('../src/controllerManager');
const ModelManager = require('../src/modelManager');

program.parse(process.argv);

const thing = program.args[0];
const name = program.args[1];
if (thing && name) {
  console.log(chalk.blue('deleting a new' + thing + ' named ' + name)); // eslint-disable-line no-console
  switch (thing) {
    case 'controller': {
      const controllerManager = new ControllerManager();
      controllerManager.delete(name);
      break;
    }
    case 'model': {
      const modelManager = new ModelManager();
      modelManager.delete(name);
      break;
    }
    case 'worker': {
      const workerManager = new WorkerManager();
      workerManager.delete(name);
      break;
    }
    default:
      console.log('please enter a command'); // eslint-disable-line no-console
  }
} else {
  console.log(chalk.red('missing entity or name')); // eslint-disable-line no-console
}
