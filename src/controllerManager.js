const path = require('path');

const projConfig = require(path.resolve('./config'));
const config = projConfig.getConfig();
const proj = config.name;

const fs = require('fs');
const logger = require('./logger');
const inquirer = require('inquirer');
const chalk = require('chalk');
const deleteQuestionPrompt = require('./inquirer');

/**
 * @class ControllerManager
 */
class ControllerManager {
  /**
   * logs a list of existing controllers
   * @method ControllerManager#showList
   * @memberof ControllerManager
   */
  showList() {
    let controllers = fs.readdirSync(path.resolve(`./${proj}-api/controllers`));
    controllers.map(controller => logger.log(path.parse(controller).name));
  }
  /**
   * logs an error if methods did not run in a pushkin folder
   * @method ControllerManager#ensureDirectory
   * @memberof ControllerManager
   */
  ensureDirectory() {
    const isPushkin = fs.existsSync(path.resolve(`./${proj}-api`));
    if (!isPushkin) {
      logger.error('Sorry couldnt find a pushkin-api folder');
      throw new Error('Not a pushkin project');
    }
  }
  /**
   * returns if a controller already exist in `./${proj}-api/controllers`
   * @method ControllerManager#checkExistence
   * @memberof ControllerManager
   * @param {String} name - name of controller to check
   * @returns {Boolean}
   */
  checkExistence(name) {
    const controllerPath = path.resolve(`./${proj}-api/controllers`);
    const to = fs.readdirSync(controllerPath);
    if (!to) {
      logger.error('Couldnt finda controllers folder tried,', controllerPath);
      throw new Error('Couldnt find a controllers folder');
    }
    const exist = to.some(currentFilename => {
      return currentFilename.indexOf(name) > -1;
    });
    return exist;
  }
  /**
   * sets template data resulting from reading /template/controllers/controller.js to controller constructor
   * @method ControllerManager#loadTemplate
   * @memberof ControllerManager
   */
  loadTemplate() {
    const templateData = fs.readFileSync(
      path.resolve(__dirname, `../templates/controllers/controller.js`),
      'utf-8'
    );
    this.templateData = templateData;
  }
  /**
   * copies /template/controllers/controller.js to disk
   * @method ControllerManager#copyTemplate
   * @param {String} name - name of controller to create
   * @memberof ControllerManager
   */
  copyTemplate(name) {
    fs.writeFileSync(
      path.resolve(`./${proj}-api/controllers/${name}.js`),
      this.templateData
    );
  }
  /**
   * creates a new controller with specified name
   * @method ControllerManager#generate
   * @param {String} name - name of controller to create
   * @memberof ControllerManager
   */
  generate(name) {
    //check if file exist in the controller folder
    // if it doesnt exist, copy file
    // else notify user the file already exist
    this.ensureDirectory();
    const isExists = this.checkExistence(name);
    if (isExists) {
      return logger.log(
        chalk.red(`Sorry there is already a controller named ${name}`)
      );
    }
    this.loadTemplate();
    this.copyTemplate(name);
  }
  /**
   * delete an existing controller with specified name
   * @method ControllerManager#delete
   * @param {String} name - name of controller to delete
   * @memberof ControllerManager
   */
  delete(name) {
    inquirer.prompt(deleteQuestionPrompt(name, 'controller')).then(answer => {
      if (answer.confirmation) {
        this.ensureDirectory();
        const isExists = this.checkExistence(name);
        if (isExists) {
          const targetFile = path.resolve(
            `./${proj}-api/controllers/${name}.js`
          );
          fs.unlink(targetFile, err => {
            if (err) {
              return logger.log(
                `Sorry there was an error removing the controller ${name}`,
                err
              );
            }
          });
          return logger.log(chalk.blue('controller deleted'));
        }
      }
      process.exit(1);
    });
  }
}

module.exports = ControllerManager;
