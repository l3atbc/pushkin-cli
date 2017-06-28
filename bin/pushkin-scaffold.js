#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
program.parse(process.argv);
const ScaffoldManager = require('../src/scaffoldManager');

const name = program.args[0];
const scaffoldManager = new ScaffoldManager();
if (name) {
	if (scaffoldManager.workerConflict(name)){
		console.log(chalk.red('a worker already exists with the specified name'));
	}
	else if (scaffoldManager.controllerConflict(name)){
		console.log(chalk.red('a controller already exists with the specified name'));
	}
	else if (scaffoldManager.modelsConflict(name)){
		console.log(chalk.red('models already exist with the specified name'));
	}
	else if (scaffoldManager.migrationsConflict(name)){
		console.log(chalk.red('migrations already exist with the specified name'));
	}
	else if (scaffoldManager.seedsConflict(name)){
		console.log(chalk.red('seeds already exist with the specified name'));
	}
	else {
		scaffoldManager.generate(name);
	}
}
