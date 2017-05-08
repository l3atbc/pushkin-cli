const yaml = require('js-yaml');
const fs   = require('fs');
const ncp = require('ncp').ncp;
const path = require('path');

module.exports = class WorkerContructor {
  constructor(name) {
    this.dockerPaths = {};
    this.name = name;
    this.folderName = `${name}-worker`;
  }
  generate() {
    this.loadDockerPaths();
    this.loadOriginalDocuments()
    this.createWorker()
    this.createNewDocuments()
    this.writeDocuments()
    this.copyFolder();
    this.finish()
  }
  getCliPath(filePath) {
    return path.resolve(__dirname, filePath)
  }
  loadOriginalDocuments() {
    this.dockerPaths.debug.original =  yaml.safeLoad(fs.readFileSync(this.getDockerPath('debug'), 'utf-8'));
    this.dockerPaths.normal.original =  yaml.safeLoad(fs.readFileSync(this.getDockerPath('normal'), 'utf-8'));
    this.dockerPaths.production.original =  yaml.safeLoad(fs.readFileSync(this.getDockerPath('production'), 'utf-8'));
  }
  loadDebugDockerPath() {
    const debugDockerPath = path.resolve('docker-compose.debug.yml')
    this.dockerPaths.debug = {
      path: debugDockerPath,
    }
  }
  loadProductionDockerPath() {
    const productionDockerPath = path.resolve('docker-compose.production.yml')
    this.dockerPaths.production = {
      path: productionDockerPath,
    }
  }
  loadDockerPath() {
    const dockerPath = path.resolve('docker-compose.production.yml')
    this.dockerPaths.normal = {
      path: dockerPath
    };
  }
  loadDockerPaths() {
    this.loadDebugDockerPath();
    this.loadProductionDockerPath();
    this.loadDockerPath();
  }
  getDockerPath(type) {
    return this.dockerPaths[type].path;
  }
  createWorker() {
    var worker = this.getCliPath('../generalYaml/worker.yml')
    worker = fs.readFileSync(worker, 'utf-8');
    worker = yaml.safeLoad(worker);
    worker.build.context = `${this.name}-worker`
    worker.volumes[0] = `./${this.folderName}:/usr/src/app`
    worker.environment[1] = `QUEUE=${this.name}`;
    this.worker = worker;
  }
  createNewDocuments() {
    Object.keys(this.dockerPaths).map(key => {
      this.dockerPaths[key].document  = this.dockerPaths[key].original
      this.dockerPaths[key].document.services[this.folderName] = this.worker
    })
  }
  writeDocuments() {
    Object.keys(this.dockerPaths).map(key => {
      fs.writeFileSync(this.getDockerPath(key), yaml.safeDump(this.dockerPaths[key].document, { noRefs: true }));
    })
  }
  copyFolder() {
    const workerPath = path.resolve('pushkin-worker');
    console.log('copying from ', workerPath, 'to' , this.folderName);
    ncp(workerPath, this.folderName, err => {
      if(err) {
        this.handleError(err)
        // return process.exit(1)
      } 
      console.log('copy complete')
    })
  }
  finish() {
    // process.exit()
  }
  handleError(error) {
    console.error(error);

  }
}