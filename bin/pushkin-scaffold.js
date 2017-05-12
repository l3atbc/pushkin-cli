#!/usr/bin/env node
const program = require('commander');
program.parse(process.argv);
const ScaffoldManager = require('../src/scaffoldManager');

const name = program.args[0];
const scaffoldManager = new ScaffoldManager();
if (name) {
  scaffoldManager.generate(name);
}
