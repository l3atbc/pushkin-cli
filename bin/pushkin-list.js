#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const ControllerManager = require('../src/controllerManager');
const ModelManager = require('../src/modelManager');

program.parse(process.argv);

const thing = program.args[0];
if (thing) {
  switch (thing) {
    case 'controller': {
      const controllerManager = new ControllerManager();
      controllerManager.showList();
      break;
    }
    case 'model': {
      const modelManager = new ModelManager();
      modelManager.showList();
      break;
    }
    default:
      console.log('please enter a command'); // eslint-disable-line no-console
  }
} else {
  console.log(chalk.red('missing entity name')); // eslint-disable-line no-console
}
