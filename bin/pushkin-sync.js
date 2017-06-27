#!/usr/bin/env node

const chalk = require('chalk');
const SyncManager = require('../src/syncManager');

console.log(chalk.blue('syncing experiment files')); // eslint-disable-line no-console

const syncManager = new SyncManager();
syncManager.sync();