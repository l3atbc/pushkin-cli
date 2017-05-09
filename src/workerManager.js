const yaml = require('js-yaml');
const fs = require('fs');
const ncp = require('ncp').ncp;
const path = require('path');
const logger = require('./logger');

module.exports = class WorkerManager {
  constructor() {
    this.dockerPaths = {};
    this.loadDockerPaths();
    this.loadOriginalDocuments();
  }
  generate(name) {
    this.name = name;
    this.folderName = `${name}-worker`;
    this.createWorker();
    this.createNewDocuments();
    this.writeDocuments();
    this.copyFolder();
    this.finish();
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
    var worker = this.getCliPath('../templates/yaml/worker.yml');
    try {
      worker = fs.readFileSync(worker, 'utf-8');
      worker = yaml.safeLoad(worker);
      worker.build.context = `./${this.name}-worker`;
      worker.volumes[0] = `./${this.folderName}:/usr/src/app`;
      worker.environment[1] = `QUEUE=${this.name}`;
      this.worker = worker;
    } catch (e) {
      logger.error('Couldnt find the worker.yml', worker, e);

      throw new Error('couldnt find the worker.yml');
    }
  }
  createNewDocuments() {
    Object.keys(this.dockerPaths).map(key => {
      this.dockerPaths[key].document = this.dockerPaths[key].original;
      this.dockerPaths[key].document.services[this.folderName] = this.worker;
    });
  }
  writeDocuments() {
    Object.keys(this.dockerPaths).map(key => {
      fs.writeFileSync(
        this.getDockerPath(key),
        yaml.safeDump(this.dockerPaths[key].document, {
          noRefs: true
        })
      );
    });
  }
  copyFolder() {
    const workerPath = path.resolve('pushkin-worker');
    logger.log('copying from ', workerPath, 'to', this.folderName);
    ncp(workerPath, this.folderName, err => {
      if (err) {
        this.handleError(err);
        // return process.exit(1)
      }
      logger.log('copy complete');
    });
  }
  finish() {
    // process.exit()
  }
  handleError(error) {
    logger.error(error);
  }
};
