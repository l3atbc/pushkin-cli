#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const moment = require('moment');
const WorkerManager = require('../src/workerManager');
const ControllerManager = require('../src/controllerManager');
const ModelManager = require('../src/modelManager');

program.parse(process.argv);

const thing = program.args[0];
const name = program.args[1];
if (thing && name) {
  console.log(chalk.blue('generating a new' + thing + ' named ' + name)); // eslint-disable-line no-console
  switch (thing) {
    case 'controller': {
      const controllerManager = new ControllerManager();
      controllerManager.generate(name);
      break;
    }
    case 'model': {
      const modelManager = new ModelManager();
      modelManager.generate(name);
      break;
    }
    case 'worker': {
      var workerConstructor = new WorkerManager(name);
      workerConstructor.generate();
      break;
    }
    default:
      console.log('please input a command'); // eslint-disable-line no-console
  }
} else {
  console.log(chalk.red('missing entity or name')); // eslint-disable-line no-console
}
