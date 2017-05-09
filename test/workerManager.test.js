/* eslint-env mocha */
const yaml = require('js-yaml');

const expect = require('chai').expect;
const sinon = require('sinon');
const path = require('path');
var proxyquire = require('proxyquire');
const fs = require('fs');

const mockFse = {
  remove: sinon.stub().returns(Promise.resolve())
};

const mockFs = {
  writeFileSync: sinon.stub(),
  readFileSync: sinon.stub(),
  readdirSync: sinon.stub(),
  existsSync: sinon.stub(),
  rmdirSync: sinon.stub(),
  unlink: sinon.stub()
};
const mockNCP = {
  ncp: sinon.stub()
};
const mockInquirer = {
  prompt: sinon.stub().returns(Promise.resolve({ delete: true }))
};
const workerPath = path.resolve('./templates/yaml/worker.yml');
const workerContents = fs.readFileSync(workerPath, 'utf-8');
function setupMocks() {
  mockNCP.ncp
    .withArgs(path.resolve('pushkin-worker'), 'test-worker', () => {})
    .returns();
  mockFs.readFileSync
    .withArgs(path.resolve('docker-compose.debug.yml'), 'utf-8')
    .returns(yaml.safeDump({ services: { 'debug-service': 'debug' } }));
  mockFs.readFileSync
    .withArgs(path.resolve('docker-compose.yml'), 'utf-8')
    .returns(yaml.safeDump({ services: { 'normal-service': 'normal' } }));
  mockFs.readFileSync
    .withArgs(path.resolve('docker-compose.production.yml'), 'utf-8')
    .returns(
      yaml.safeDump({ services: { 'production-service': 'production' } })
    );

  mockFs.readFileSync.withArgs(workerPath, 'utf-8').returns(workerContents);
}
const logger = {
  log: sinon.stub(),
  error: console.log // eslint-disable-line no-console
};

const WorkerManager = proxyquire('../src/workerManager', {
  './logger': logger,
  fs: mockFs,
  ncp: mockNCP,
  inquirer: mockInquirer,
  'fs-extra': mockFse
});
describe('WorkerManager', () => {
  beforeEach(() => {
    mockFs.writeFileSync.resetHistory();
    mockFs.readdirSync.resetHistory();
    mockFs.readFileSync.resetHistory();
    mockFs.unlink.resetHistory();
    mockFse.remove.resetHistory();
    mockNCP.ncp.resetHistory();
    logger.log.resetHistory();
    setupMocks();
  });
  it('exists', () => {
    expect(WorkerManager).to.exist;
  });
  describe('#loadDockerPaths', () => {
    it('loads Docker paths', () => {
      const workerManager = new WorkerManager();
      expect(workerManager.dockerPaths).to.eql({
        debug: {
          original: {
            services: {
              'debug-service': 'debug'
            }
          },
          path: path.resolve('docker-compose.debug.yml')
        },
        production: {
          original: {
            services: {
              'production-service': 'production'
            }
          },
          path: path.resolve('docker-compose.production.yml')
        }
      });
    });
  });
  describe('#createWorker', () => {
    it('loads worker and sets it as an instance variable', () => {
      const workerManager = new WorkerManager();
      workerManager.name = 'test';
      workerManager.folderName = `test-worker`;
      workerManager.createWorker();
      expect(workerManager.worker).to.eql({
        build: {
          context: './test-worker',
          dockerfile: 'Dockerfile'
        },
        command: 'bash start.debug.sh',
        depends_on: ['message-queue'],
        environment: ['AMPQ_ADDRESS=amqp://message-queue:5672', 'QUEUE=test'],
        image: 'pushkinl3/pushkin-worker:latest',
        links: ['message-queue'],
        volumes: ['./test-worker:/usr/src/app']
      });
    });
  });
  describe('#createNewDocuments', () => {
    it('goes through the loaded dockerPaths and adds a new section to services', () => {
      const workerManager = new WorkerManager();
      workerManager.name = 'test';
      workerManager.folderName = `test-worker`;
      workerManager.createWorker();
      workerManager.createNewDocuments();
      const originalYaml = yaml.safeLoad(workerContents);
      expect(
        workerManager.dockerPaths.debug.document.services['test-worker'].build
          .context
      ).to.eql('./test-worker');
      expect(
        workerManager.dockerPaths.debug.document.services['test-worker']
          .environment
      ).to.eql(['AMPQ_ADDRESS=amqp://message-queue:5672', 'QUEUE=test']);
      expect(
        workerManager.dockerPaths.production.document.services['test-worker']
          .build.context
      ).to.eql('./test-worker');
      expect(
        workerManager.dockerPaths.production.document.services['test-worker']
          .environment
      ).to.eql(['AMPQ_ADDRESS=amqp://message-queue:5672', 'QUEUE=test']);
    });
  });
  describe('#generate', () => {
    it('has a method generate', () => {
      const workerManager = new WorkerManager();
      expect(workerManager).to.have.property('generate');
    });
    it('creates 3 new docker files', () => {
      const workerManager = new WorkerManager();
      mockFs.readFileSync
        .withArgs(path.resolve('./generalYaml/worker.yml'), 'utf-8')
        .returns(
          'image: pushkinl3/pushkin-worker:latest\nbuild:\n  context: ./pushkin-worker\n  dockerfile: Dockerfile\nvolumes:\n  - ./pushkin-worker:/usr/src/app\ncommand: bash start.debug.sh\ndepends_on:\n  - "message-queue"\nenvironment:\n  - AMPQ_ADDRESS=amqp://message-queue:5672\n  - QUEUE=verbcorner\nlinks:\n  - message-queue'
        );
      workerManager.generate('test');

      expect(mockFs.readFileSync.called).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[0]).to.eql(
        path.resolve('docker-compose.debug.yml')
      );

      expect(yaml.safeLoad(mockFs.writeFileSync.firstCall.args[1])).to.eql({
        services: {
          'debug-service': 'debug',
          'test-worker': {
            build: {
              context: './test-worker',
              dockerfile: 'Dockerfile'
            },
            command: 'bash start.debug.sh',
            depends_on: ['message-queue'],
            environment: [
              'AMPQ_ADDRESS=amqp://message-queue:5672',
              'QUEUE=test'
            ],
            image: 'pushkinl3/pushkin-worker:latest',
            links: ['message-queue'],
            volumes: ['./test-worker:/usr/src/app']
          }
        }
      });
    });
    it('copies a folder', () => {
      const workerManager = new WorkerManager();
      workerManager.generate('apple');
      expect(mockNCP.ncp.called).to.be.true;
      expect(mockNCP.ncp.firstCall.args[1]).to.eql('apple-worker');
    });
  });
  describe('#list', () => {
    it('prints a list of workers to the console');
  });
  describe('#delete', () => {
    it('has a command delete', () => {
      const workerManager = new WorkerManager();
      expect(workerManager).to.have.property('delete');
    });
    it('checks if that worker exists', () => {
      const workerManager = new WorkerManager();
      mockFs.readdirSync.withArgs(path.resolve('./')).returns([]);
      workerManager.delete('test');
      expect(mockFs.readdirSync.called).to.be.true;
      expect(mockFs.readdirSync.firstCall.args).to.eql([path.resolve('./')]);
    });
    it('prompts the user if that worker does', () => {
      mockFs.readdirSync.withArgs(path.resolve('./')).returns(['apple-worker']);
      const workerManager = new WorkerManager();
      return workerManager.delete('apple').then(response => {
        expect(mockInquirer.prompt.firstCall.args).to.eql([
          [
            {
              name: 'delete',
              type: 'confirm',
              message: 'Are you sure you want to delete this worker?'
            }
          ]
        ]);
      });
    });
    it('deletes that folder if the user presses y', () => {
      mockFs.readdirSync.withArgs(path.resolve('./')).returns(['apple-worker']);
      const workerManager = new WorkerManager();
      return workerManager.delete('apple').then(response => {
        expect(mockFse.remove.called).to.be.true;
        expect(mockFse.remove.firstCall.args).to.eql([
          path.resolve('./apple-worker')
        ]);
      });
    });
  });
});
