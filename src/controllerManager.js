const fs = require('fs');
const path = require('path');
const logger = require('./logger');

module.exports = class ControllerManager {
  showList() {
    let controllers = fs.readdirSync(path.resolve('./pushkin-api/controllers'));
    controllers.map(controller => logger.log(path.parse(controller).name));
  }
  ensureDirectory() {
    const isPushkin = fs.exists(path.resolve('./pushkin-api'));
    if (!isPushkin) {
      logger.error('Sorry couldnt find a pushkin-api folder');
      throw new Error('Not a pushkin project');
    }
  }
  checkExistence(name) {
    const controllerPath = path.resolve(`./pushkin-api/controllers`);
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
  checkTemplate() {
    const templateData = fs.readFileSync(
      path.resolve(__dirname, `../templates/controllers/controller.js`),
      'utf-8'
    );
    this.templateData = templateData;
  }
  copyTemplate(name) {
    fs.writeFileSync(
      path.resolve(`./pushkin-api/controllers/${name}.js`),
      this.templateData
    );
  }
  generate(name) {
    //check if file exist in the controller folder
    // if it doesnt exist, copy file
    // else notify user the file already exist
    this.ensureDirectory();
    const isExists = this.checkExistence(name);
    if (isExists) {
      return logger.log(`Sorry there is already a controller named ${name}`);
    }
    this.checkTemplate();
    this.copyTemplate(name);
  }
};
