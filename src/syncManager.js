const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const logger = require('./logger');
const moment = require('moment');
const chalk = require('chalk');
const inquirer = require('inquirer');
const deleteQuestionPrompt = require('./inquirer');
/**
 * @class DbItemsManager
 */
class SyncManager {

  sync(){
    this.clean();
    this.copy();
    console.log('experiment files synced');
  }

  clean() {
    fse.emptyDirSync(path.resolve('./db-worker/models'));
    fse.emptyDirSync(path.resolve('./db-worker/migrations'));
    fse.emptyDirSync(path.resolve('./db-worker/seeds'));
    fse.emptyDirSync(path.resolve('./api/controllers'));
    fse.emptyDirSync(path.resolve('./workers'));
  }

  copy() {
    fs.readdirSync(path.resolve('./experiments')).forEach(exp => {
      if (exp !== '.DS_Store' ) {
        fse.copySync(path.resolve(`./experiments/${exp}/models`), path.resolve(`./db-worker/models/${exp}`));
        fse.copySync(path.resolve(`./experiments/${exp}/seeds`), path.resolve(`./db-worker/seeds/${exp}`));
        fse.copySync(path.resolve(`./experiments/${exp}/worker`), path.resolve(`./workers/${exp}`));
        fs.readdirSync(path.resolve(`./experiments/${exp}/migrations`)).forEach(migration => {
          fse.copySync(path.resolve(`./experiments/${exp}/migrations/${migration}`), path.resolve(`./db-worker/migrations/${migration}`));
        });
        fs.readdirSync(path.resolve(`./experiments/${exp}/controller`)).forEach(controller => {
          fse.copySync(path.resolve(`./experiments/${exp}/controller/${controller}`), path.resolve(`./api/controllers/${controller}`));
        });
      }
    });
  }

}

module.exports = SyncManager;
