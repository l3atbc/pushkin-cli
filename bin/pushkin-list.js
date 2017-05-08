#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');

function showControllerList() {
  try {
    const controllers = fs.readdirSync(path.resolve('./pushkin-api/controllers'));
    /* eslint-disable */
    controllers.forEach(a => {
      console.log(chalk.magenta(path.parse(a).name));
    });
  } catch (err) {
    console.log(chalk.red('please make sure to run this in a pushkin folder'));
    /* eslint-enable */
  }
}

program.parse(process.argv);

const thing = program.args[0];
if (thing) {
  switch (thing) {
    case 'controller':
      showControllerList();
      break;
    case 'controllers':
      showControllerList();
      break;
    case 'model':
      break;
    default:
      console.log('please enter a command'); // eslint-disable-line no-console
  }
} else {
  console.log(chalk.red('missing entity name')); // eslint-disable-line no-console
}
