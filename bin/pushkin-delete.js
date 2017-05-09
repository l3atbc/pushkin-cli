#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const WorkerManager = require('../src/WorkerManager');

function deleteController(quizname) {
  try {
    const targetFile = path.resolve(`./pushkin-api/controllers/${quizname}.js`);
    fs.unlink(targetFile, err => {
      if (err) {
        console.error(err); // eslint-disable-line no-console
        process.exit(1);
      }
      process.exit();
    });
  } catch (err) {
    console.log(chalk.red('please make sure to run this in a pushkin folder')); // eslint-disable-line no-console
  }
}

program.parse(process.argv);

const thing = program.args[0];
const name = program.args[1];
if (thing && name) {
  console.log(chalk.blue('deleting a new' + thing + ' named ' + name)); // eslint-disable-line no-console

  switch (thing) {
    case 'controller':
      deleteController(name);
      break;
    case 'model':
      break;
    case 'worker':
      const workerManager = new WorkerManager();
      workerManager.delete(name);
      break;
    default:
      console.log('please enter a command'); // eslint-disable-line no-console
  }
} else {
  console.log(chalk.red('missing entity or name')); // eslint-disable-line no-console
}
