const yaml = require('js-yaml');
const fs = require('fs');
const ncp = require('ncp').ncp;
const path = require('path');
const logger = require('./logger');
const inquirer = require('inquirer');
const fse = require('fs-extra');

module.exports = class WorkerManager {
  constructor() {
    this.dockerPaths = {};
    this.loadDockerPaths();
    this.loadOriginalDocuments();
  }
  conflict(name) {
    if (fs.existsSync(path.resolve(`./experiments/${name}/worker`))) {
      return true;
    }
    else {
      return false;
    }
  }
  generate(name) {
    this.name = name;
    fse.ensureDirSync(path.resolve(`./experiments/${name}/worker`))
    this.createWorker();
    this.createNewDocuments();
    this.writeDocuments();
    this.copyFolder();
  }
  getCliPath(filePath) {
    return path.resolve(__dirname, filePath);
  }
  loadOriginalDocuments() {
    this.dockerPaths.debug.original = yaml.safeLoad(
      fs.readFileSync(this.getDockerPath('debug'), 'utf-8')
    );
    this.dockerPaths.production.original = yaml.safeLoad(
      fs.readFileSync(this.getDockerPath('production'), 'utf-8')
    );
  }
  loadDebugDockerPath() {
    const debugDockerPath = path.resolve('docker-compose.debug.yml');
    this.dockerPaths.debug = {
      path: debugDockerPath,
      original: null
    };
  }
  loadProductionDockerPath() {
    const productionDockerPath = path.resolve('docker-compose.production.yml');
    this.dockerPaths.production = {
      path: productionDockerPath,
      original: null
    };
  }
  loadDockerPaths() {
    this.loadDebugDockerPath();
    this.loadProductionDockerPath();
  }
  getDockerPath(type) {
    return this.dockerPaths[type].path;
  }
  createWorker() {
    var worker = this.getCliPath('../templates/python-worker/worker.yml');
    var productionWorker = this.getCliPath(
      '../templates/python-worker/worker.production.yml'
    );
    try {
      worker = fs.readFileSync(worker, 'utf-8');
      worker = yaml.safeLoad(worker);
      worker.image = `DOCKERHUB_ID/${this.name}:latest`;
      worker.build.context = `./workers/${this.name}`;
      worker.volumes[0] = `./workers/${name}:/usr/src/app`;
      worker.environment[1] = `QUEUE=${this.name}`;
      this.worker = worker;
    } catch (e) {
      logger.error('Couldn\'t find the worker.yml', worker, e);

      throw new Error('Couldn\'t find the worker.yml');
    }
    try {
      productionWorker = fs.readFileSync(productionWorker, 'utf-8');
      productionWorker = yaml.safeLoad(productionWorker);
      productionWorker.environment[1] = `QUEUE=${this.name}`;
      this.productionWorker = productionWorker;
    } catch (e) {
      logger.error('Couldn\'t find the production worker.yml', worker, e);
      throw new Error('couldn\'t find the production worker.yml');
    }
  }
  createNewDocuments() {
    this.dockerPaths.production.document = this.dockerPaths.production.original;
    this.dockerPaths.production.document.services[
      this.name
    ] = this.productionWorker;
    this.dockerPaths.debug.document = this.dockerPaths.debug.original;
    this.dockerPaths.debug.document.services[this.name] = this.worker;
  }
  writeDocuments() {
    let document = this.dockerPaths.debug.document;
    fs.writeFileSync(
      this.getDockerPath('debug'),
      yaml.safeDump(document, {
        noRefs: true
      })
    );
    document = this.dockerPaths.production.document;
    fs.writeFileSync(
      this.getDockerPath('production'),
      yaml.safeDump(document, {
        noRefs: true
      })
    );
  }
  copyFolder() {
    const workerPath = path.resolve(__dirname, '../templates/python-worker');
    ncp(workerPath, `./experiments/${name}/worker`, err => {
      if (err) {
        this.handleError(err);
        // return process.exit(1)
      }
      logger.log('copy complete');
    });
  }
  handleError(error) {
    logger.error(error);
  }
  delete(name) {
    const directoryContents = fs.readdirSync(path.resolve('./workers'));
    const isExists = directoryContents.some(folder =>
      path.parse(folder).name.includes(name)
    );
    if (isExists) {
      return inquirer
        .prompt([
          {
            name: 'delete',
            type: 'confirm',
            message: 'Are you sure you want to delete this worker?'
          }
        ])
        .then(response => {
          if (response.delete === true) {
            return fse.remove(path.resolve(`./workers/${name}`));
          }
        })
        .then(() => {
          Object.keys(this.dockerPaths).map(key => {
            this.dockerPaths[key].document = this.dockerPaths[key].original;
            delete this.dockerPaths[key].document.services[`${name}`];
          });
          return this.writeDocuments();
        });
    }
  }
};
