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
class dbItemsManager {
  /**
   * logs a list of existing models
   * @method DbItemsManager#showList
   * @memberof DbItemsManager
   */
  showList() {
    let models = [];
    fs.readdirSync(path.resolve('./experiments')).forEach(exp => {
      if (exp !== '.DS_Store' ) {
        models.concat(fs.readdirSync(path.resolve(`./experiments/${exp}/models`)));
      }
    });
    models.map(model => logger.log(path.parse(model).name));
  }
  /**
   * logs an error if methods did not run in a pushkin folder
   * @method DbItemsManager#ensureDirectory
   * @memberof DbItemsManager
   */
  ensureDirectory() {
    const isPushkin = fs.existsSync(path.resolve(`./experiments`));
    if (!isPushkin) {
      logger.error('Sorry couldn\'t find an experiments folder');
      throw new Error('Not a pushkin project');
    }
  }
  /**
   * check if migrations/models/seeds folder already exist in `/pushkin-api`
   * @method DbItemsManager#checkExistence
   * @memberof DbItemsManager
   * @param {String} type - 'migrations'|'seeds'|'models'
   * @returns an error message if type folder doesnt exist
   */
  checkExistence(type) {
    fse.ensureDirSync(path.resolve(`./experiments/${this.name}/${type}`))
  }
  /**
   * returns if a modelWantToCreate already exist in `/pushkin-api/${type}/${modelWantToCreate}`
   * @method DbItemsManager#checkCollisions
   * @memberof DbItemsManager
   * @param {String} type - 'migrations'|'seeds'|'models'
   * @returns {Boolean}
   */
  checkCollisions(type) {
    const thingPath = path.resolve(`./experiments/${this.name}/${type}`);
    const contents = fs.readdirSync(thingPath);
    const index = contents.indexOf('.DS_Store');
    if (index > -1) {
      contents.splice(index, 1);
    }
    if (contents.length == 0) {
      return false;
    }
    else {
      return true;
    }
  }
  /**
   * returns if migrations for modelWantToCreate already exist in `/pushkin-api/migrations/${modelWantToCreate}`
   * @method DbItemsManager#checkCollisions
   * @memberof DbItemsManager
   * @returns {Boolean}
   */
  checkMigrationCollisions() {
    const thingPath = path.resolve(`./experiments/${this.name}/migrations`);
    const existingMigrationFiles = fs.readdirSync(thingPath);
    return existingMigrationFiles.some(currentFile => {
      const nameArray = currentFile.split('_');
      return nameArray.indexOf(this.name) > -1;
    });
  }
  checkMigrationsDirectoryExists() {
    this.checkExistence('migrations');
  }
  checkModelsDirectoryExists() {
    this.checkExistence('models');
  }
  checkSeedsDirectoryExists() {
    this.checkExistence('seeds');
  }
  /**
   * returns template directory for migrations/models/seeds
   * @method DbItemsManager#readTemplateDir
   * @memberof DbItemsManager
   * @param {String} type - 'migrations'|'models'|'seeds'
   * @returns an array of file names
   */
  readTemplateDir(type) {
    return fs.readdirSync(path.resolve(__dirname, `../templates/${type}`));
  }
  completeRegex(mapObj) {
    return new RegExp(Object.keys(mapObj).join('|'), 'g');
  }
  partialRegex(mapObj) {
    return new RegExp(Object.keys(mapObj).join('|'));
  }
  switchRegex(type, mapObj) {
    return type === 'migrations'
      ? this.completeRegex(mapObj)
      : this.partialRegex(mapObj);
  }
  formatWritePath(type, currentFileName, index) {
    const migrationPath = path.resolve(
      `./experiments/${this.name}/migrations/${moment()
        .add(index, 'second')
        .format(
          'YYYYMMDDHHmmss'
        )}_create_${this.name}_${currentFileName.replace(/\d_/, '')}`
    );
    const modelPath = path.resolve(
      `./experiments/${this.name}/models/${currentFileName}`
    );
    const seedPath = path.resolve(
      `./experiments/${this.name}/seeds/${currentFileName}`
    );
    switch (type) {
      case 'migrations':
        return migrationPath;
      case 'models':
        return modelPath;
      case 'seeds':
        return seedPath;
      default:
        logger.log('type of file is not migrations, models, or seeds');
    }
  }
  /**
   * reads file in migrations/bookshelf models/seeds template folder and writes to the corresponding pushkin-db folder
   * @method DbItemsManager#loadTemplateThenWrite
   * @memberof DbItemsManager
   * @param {String} type - 'migrations'|'seeds'|'models'
   */
  loadTemplateThenWrite(type) {
    this.mapObj = {
      trials: `${this.name}_trials`,
      questions: `${this.name}_questions`,
      choices: `${this.name}_choices`,
      users: `${this.name}_users`,
      responses: `${this.name}_responses`
    };
    const fileNames = this.readTemplateDir(type);
    const re = this.switchRegex(type, this.mapObj);
    fileNames.sort().forEach((currentFile, index) => {
      const templateDataPath = path.resolve(
        __dirname,
        `../templates/${type}/${currentFile}`
      );
      const templateData = fs.readFileSync(templateDataPath, 'utf-8');
      if (templateData) {
        let result = type !== 'seeds'
          ? templateData.replace(re, matched => {
              return this.mapObj[matched];
            })
          : templateData;
        fs.writeFileSync(
          this.formatWritePath(type, currentFile, index),
          result
        );
      } else {
        throw new Error('couldn\'t find templateData, tried' + templateDataPath);
      }
    });
  }
  loadSeedTemplate() {
    this.loadTemplateThenWrite('seeds');
  }
  loadModelTemplate() {
    this.loadTemplateThenWrite('models');
  }
  loadMigrationTemplate() {
    this.loadTemplateThenWrite('migrations');
  }
  /**
   * creates new migrations for modelsWantToCreate
   * @method DbItemsManager#generateMigrations
   * @memberof DbItemsManager
   */
  generateMigrations() {
    this.checkMigrationsDirectoryExists();
    const isExists = this.checkMigrationCollisions();
    if (!isExists) {
      this.loadMigrationTemplate();
    } else {
      logger.log(chalk.red(`Sorry ${this.name} migrations already exist`));
      this.deleteSeeds('rollback');
      this.deleteModels('rollback');
    }
  }
  /**
   * creates new bookshelf models for modelsWantToCreate
   * @method DbItemsManager#generateModels
   * @memberof DbItemsManager
   */
  generateModels() {
    this.checkModelsDirectoryExists();
    const isExists = this.checkCollisions('models');
    if (!isExists) {
      this.loadModelTemplate();
    } else {
      logger.log(chalk.red(`Sorry ${this.name} models already exist`));
      this.deleteSeeds('rollback');
      this.deleteMigrations('rollback');
    }
  }
  /**
   * creates new seed files for modelsWantToCreate
   * @method DbItemsManager#generateSeeds
   * @memberof DbItemsManager
   */
  generateSeeds() {
    this.checkSeedsDirectoryExists();
    const isExists = this.checkCollisions('seeds');
    if (!isExists) {
      this.loadSeedTemplate();
    } else {
      logger.log(chalk.red(`Sorry ${this.name} seeds already exist`));
      this.deleteModels('rollback');
      this.deleteMigrations('rollback');
    }
  }
  /**
   * delete existing seeds for model
   * @method DbItemsManager#deleteSeeds
   * @param {String} condition - optional param
   * @memberof DbItemsManager
   */
  deleteSeeds(condition) {
    if (fs.existsSync(path.resolve(`./experiments/${this.name}/seeds`))) {
      const folderPath = path.resolve(`./experiments/${this.name}/seeds`);
      fse.removeSync(folderPath);
      if (condition) {
        logger.log(`rolled back ${this.name} seeds`);
      } else {
        logger.log(`destroyed ${this.name} seeds`);
      }
    }
  }
  /**
   * delete existing bookshelf models for model
   * @method DbItemsManager#deleteModels
   * @param {String} condition - optional param
   * @memberof DbItemsManager
   */
  deleteModels(condition) {
    if (fs.existsSync(path.resolve(`./experiments/${this.name}/models`))) {
      const folderPath = path.resolve(`./experiments/${this.name}/models`);
      fse.removeSync(folderPath);
      if (condition) {
        logger.log(`rolled back ${this.name} models`);
      } else {
        logger.log(`destroyed ${this.name} models`);
      }
    }
  }
  /**
   * delete existing migrations for model
   * @method DbItemsManager#deleteMigrations
   * @param {String} condition - optional param
   * @memberof DbItemsManager
   */
  deleteMigrations(condition) {
    if (fs.existsSync(path.resolve(`./experiments/${this.name}/migrations`))) {
      const folderPath = path.resolve(`./experiments/${this.name}/migrations`);
      fse.removeSync(folderPath);
      if (condition) {
        logger.log(`rolled back ${this.name} migrations`);
      } else {
        logger.log(`destroyed ${this.name} migrations`);
      }
    }
  }
  /**
   * delete existing migrations, models, and seeds for a model with specified name
   * @method DbItemsManager#delete
   * @param {String} name - name of model to delete
   * @memberof DbItemsManager
   */
  delete(name) {
    this.name = name;
    this.ensureDirectory();
    inquirer.prompt(deleteQuestionPrompt(this.name, 'model')).then(answer => {
      if (answer.confirmation) {
        this.deleteMigrations();
        this.deleteModels();
        this.deleteSeeds();
        return logger.log(chalk.blue('dbItems deleted'));
      }
      process.exit(1);
    });
  }
  /**
   * creates new migrations, bookshelf models, and seeds for a model with specified name
   * @method ModalManager#generate
   * @param {String} name - name of model to create
   * @memberof DbItemsManager
   */
  generate(name) {
    this.name = name;
    this.ensureDirectory();
    this.generateModels();
    this.generateSeeds();
    this.generateMigrations();
  }
  checkMigrationsConflict(name) {
    if (!fs.existsSync(path.resolve(`./experiments/${name}/migrations`))) {
      return false
    }
    const thingPath = path.resolve(`./experiments/${name}/migrations`);
    const existingMigrationFiles = fs.readdirSync(thingPath);
    return existingMigrationFiles.some(currentFile => {
      const nameArray = currentFile.split('_');
      return nameArray.indexOf(name) > -1;
    });
  }
  migrationsConflict(name) {
    const migrations_check = this.checkMigrationsConflict(name);
    if (migrations_check) {
      return true;
    }
    else {
      return false;
    }    
  }
  seedsConflict(name){
    if (fs.existsSync(path.resolve(`./experiments/${name}/seeds`))) {
      return true;
    }
    else {
      return false;
    }
  }
  modelsConflict(name) {
    if (fs.existsSync(path.resolve(`./experiments/${name}/models`))) {
      return true;
    }
    else {
      return false;
    }    
  }
}
module.exports = dbItemsManager;
