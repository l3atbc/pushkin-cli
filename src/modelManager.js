const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const moment = require('moment');
const chalk = require('chalk');
const inquirer = require('inquirer');
const deleteQuestionPrompt = require('./inquirer');
/**
 * @class ModelManager
 */
class ModelManager {
  /**
   * logs a list of existing models
   * @method ModelManager#showList
   * @memberof ModelManager
   */
  showList() {
    const models = fs.readdirSync(path.resolve('./pushkin-db/models'));
    models.map(model => logger.log(path.parse(model).name));
  }
  /**
   * logs an error if methods did not run in a pushkin folder
   * @method ModelManager#ensureDirectory
   * @memberof ModelManager
   */
  ensureDirectory() {
    const isPushkin = fs.existsSync(path.resolve('./pushkin-db'));
    if (!isPushkin) {
      logger.error('Sorry couldnt find a pushkin-db folder');
      throw new Error('Not a pushkin project');
    }
  }
  /**
   * check if migrations/models/seeds folder already exist in `/pushkin-api`
   * @method ModelManager#checkExistence
   * @memberof ModelManager
   * @param {String} type - 'migrations'|'seeds'|'models'
   * @returns an error message if type folder doesnt exist
   */
  checkExistence(type) {
    const thingPath = path.resolve(`./pushkin-db/${type}`);
    const to = fs.readdirSync(thingPath);
    if (!to) {
      logger.error(`Couldnt finda ${type} folder tried,`, thingPath);
      throw new Error(`Couldnt find a ${type} foler`);
    }
  }
  /**
   * returns if a modelWantToCreate already exist in `/pushkin-api/${type}/${modelWantToCreate}`
   * @method ModelManager#checkCollisions
   * @memberof ModelManager
   * @param {String} type - 'migrations'|'seeds'|'models'
   * @returns {Boolean}
   */
  checkCollisions(type) {
    const thingPath = path.resolve(`./pushkin-db/${type}/${this.name}`);
    return fs.existsSync(thingPath);
  }
  /**
   * returns if migrations for modelWantToCreate already exist in `/pushkin-api/migrations/${modelWantToCreate}`
   * @method ModelManager#checkCollisions
   * @memberof ModelManager
   * @returns {Boolean}
   */
  checkMigrationCollisions() {
    const thingPath = path.resolve('./pushkin-db/migrations');
    const existingMigrationFiles = fs.readdirSync(thingPath);
    return existingMigrationFiles.some(currentFile => {
      const nameArray = currentFile.split('_');
      return nameArray.indexOf(this.name) > -1;
    });
  }
  checkMigrationDirectoryExists() {
    this.checkExistence('migrations');
  }
  checkModelDirectoryExists() {
    this.checkExistence('models');
  }
  checkSeedDirectoryExists() {
    this.checkExistence('seeds');
  }
  /**
   * returns template directory for migrations/models/seeds
   * @method ModelManager#readTemplateDir
   * @memberof ModelManager
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
      `./pushkin-db/migrations/${moment()
        .add(index, 'second')
        .format(
          'YYYYMMDDHHmmss'
        )}_create_${this.name}_${currentFileName.replace(/\d_/, '')}`
    );
    const modelPath = path.resolve(
      `./pushkin-db/models/${this.name}/${currentFileName}`
    );
    const seedPath = path.resolve(
      `./pushkin-db/seeds/${this.name}/${currentFileName}`
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
   * @method ModelManager#loadTemplateThenWrite
   * @memberof ModelManager
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
        throw new Error('couldnt find templateData, tried' + templateDataPath);
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
  makeDirectory(type) {
    return fs.mkdirSync(`./pushkin-db/${type}/${this.name}`);
  }
  makeSeedDirectory() {
    this.makeDirectory('seeds');
  }
  makeModelDirectory() {
    this.makeDirectory('models');
  }
  /**
   * creates new migrations for modelsWantToCreate
   * @method ModelManager#generateMigrations
   * @memberof ModelManager
   */
  generateMigrations() {
    this.checkMigrationDirectoryExists();
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
   * @method ModelManager#generateModels
   * @memberof ModelManager
   */
  generateModels() {
    this.checkModelDirectoryExists();
    const isExists = this.checkCollisions('models');
    if (!isExists) {
      this.makeModelDirectory();
      this.loadModelTemplate();
    } else {
      logger.log(chalk.red(`Sorry ${this.name} models already exist`));
      this.deleteSeeds('rollback');
      this.deleteMigrations('rollback');
    }
  }
  /**
   * creates new seed files for modelsWantToCreate
   * @method ModelManager#generateSeeds
   * @memberof ModelManager
   */
  generateSeeds() {
    this.checkSeedDirectoryExists();
    const isExists = this.checkCollisions('seeds');
    if (!isExists) {
      this.makeSeedDirectory();
      this.loadSeedTemplate();
    } else {
      logger.log(chalk.red(`Sorry ${this.name} seeds already exist`));
      this.deleteModels('rollback');
      this.deleteMigrations('rollback');
    }
  }
  /**
   * delete existing seeds for model
   * @method ModelManager#deleteSeeds
   * @param {String} condition - optional param
   * @memberof ModelManager
   */
  deleteSeeds(condition) {
    this.checkSeedDirectoryExists();
    const isExists = this.checkCollisions('seeds');
    if (isExists) {
      const folderPath = path.resolve(`./pushkin-db/seeds/${this.name}`);
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
   * @method ModelManager#deleteModels
   * @param {String} condition - optional param
   * @memberof ModelManager
   */
  deleteModels(condition) {
    this.checkSeedDirectoryExists();
    const isExists = this.checkCollisions('models');
    if (isExists) {
      const folderPath = path.resolve(`./pushkin-db/models/${this.name}`);
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
   * @method ModelManager#deleteMigrations
   * @param {String} condition - optional param
   * @memberof ModelManager
   */
  deleteMigrations(condition) {
    this.checkModelDirectoryExists();
    const migrationExists = this.checkMigrationCollisions();
    if (migrationExists) {
      const migrations = fs.readdirSync(
        path.resolve('./pushkin-db/migrations')
      );
      const migrationFiles = migrations.filter(currentMigration => {
        const nameArray = currentMigration.split('_');
        return nameArray.indexOf(this.name) > -1;
      });
      migrationFiles.forEach(currentFile => {
        if (currentFile !== '.DS_Store') {
          fs.unlink(path.resolve(`./pushkin-db/migrations/${currentFile}`));
        }
      });
      if (condition) {
        logger.log(`rolled back ${this.name} migrations`);
      } else {
        logger.log(`destroyed ${this.name} migrations`);
      }
    }
  }
  /**
   * delete existing migrations, models, and seeds for a model with specified name
   * @method ModelManager#delete
   * @param {String} name - name of model to delete
   * @memberof ModelManager
   */
  delete(name) {
    this.name = name;
    this.ensureDirectory();
    inquirer.prompt(deleteQuestionPrompt(this.name)).then(answer => {
      if (answer.confirmation) {
        this.deleteMigrations();
        this.deleteModels();
        this.deleteSeeds();
        return logger.log(chalk.blue('model deleted'));
      }
      process.exit(1);
    });
  }
  /**
   * creates new migrations, bookshelf models, and seeds for a model with specified name
   * @method ModalManager#generate
   * @param {String} name - name of model to create
   * @memberof ModelManager
   */
  generate(name) {
    this.name = name;
    this.ensureDirectory();

    this.generateModels();
    this.generateSeeds();
    this.generateMigrations();
  }
}
module.exports = ModelManager;
