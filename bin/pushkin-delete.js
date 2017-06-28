#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const WorkerManager = require('../src/workerManager');
const ControllerManager = require('../src/controllerManager');
const DbItemsManager = require('../src/dbItemsManager');

program.parse(process.argv);

const thing = program.args[0];
const name = program.args[1];
if (thing && name) {
  console.log(chalk.blue('deleting ' + thing + ' named ' + name)); // eslint-disable-line no-console
  switch (thing) {
    case 'controller': {
      const controllerManager = new ControllerManager();
      controllerManager.delete(name);
      break;
    }
    case 'dbItems': {
      const dbItemsManager = new DbItemsManager();
      dbItemsManager.delete(name);
      break;
    }
    case 'worker': {
      const workerManager = new WorkerManager();
      workerManager.delete(name);
      break;
    }
    case 'experiment': {
      if (fs.existsSync(path.resolve(`./experiments/${name}`))) {
        return inquirer
          .prompt([
            {
              name: 'delete',
              type: 'confirm',
              message: `Are you sure you want to delete the entire experiment ${name}?`
            }
          ])
          .then(response => {
            if (response.delete === true) {
              return fse.remove(path.resolve(`./experiments/${name}`));
            }
          });
      }
    }
    default:
      console.log('please enter a command'); // eslint-disable-line no-console
  }
} else {
  console.log(chalk.red('missing entity or name')); // eslint-disable-line no-console
}
