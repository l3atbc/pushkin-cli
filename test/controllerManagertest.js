/* eslint-env mocha */

const expect = require('chai').expect;
const path = require('path');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
const logger = {
  log: sinon.stub(),
  error: console.log // eslint-disable-line no-console
};

const fs = {
  writeFileSync: sinon.stub(),
  readFileSync: sinon.stub(),
  readdirSync: sinon.stub(),
  exists: sinon.stub(),
  existsSync: sinon.stub(),
  unlinkSync: sinon.stub()
};
const fse = {
  removeSync: sinon.stub().returns(Promise.resolve())
};
const ControllerManager = proxyquire('../src/controllerManager', {
  './logger': logger,
  fs: fs,
  'fs-extra': fse
});
// Utility function that extends the stubs above, on a per test case basis
const mockEnv = (existingController, templateText) => {
  let files = [existingController];
  fs.existsSync.withArgs(path.resolve('./pushkin-api')).returns(true);
  fs.readFileSync
    .withArgs(
      path.resolve(__dirname, '../templates/controllers/controller.js'),
      'utf-8'
    )
    .returns(templateText);
  fs.readdirSync
    .withArgs(path.resolve('./pushkin-api/controllers'))
    .returns(files);
  fs.writeFileSync.callsFake(filename => {
    if (filename.includes('pushkin-api/controllers')) {
      files.push(filename);
    }
  });
};

describe('ControllerManager', () => {
  beforeEach(() => {
    fs.writeFileSync.resetHistory();
    fs.readdirSync.resetHistory();
    fs.readFileSync.resetHistory();
    logger.log.resetHistory();
  });
  it('should exist', () => {
    expect(ControllerManager).to.exist;
  });
  describe('#showList', () => {
    it('has a showList method', () => {
      const c = new ControllerManager();
      expect(c).to.have.property('showList');
    });
    it('prints to a list of existing controllers to the console', () => {
      const c = new ControllerManager();
      mockEnv('apple', '');

      c.showList();
      expect(logger.log.called).to.be.true;
      expect(logger.log.firstCall.args).to.eql(['apple']);
    });
    it('shows a list of existing controllers when you call showList()', () => {
      const c = new ControllerManager();
      mockEnv('apple', '');
      c.generate('first');
      c.generate('second');
      c.showList();
      expect(logger.log.firstCall.args).to.eql(['apple']);
      expect(logger.log.secondCall.args).to.eql(['first']);
      expect(logger.log.thirdCall.args).to.eql(['second']);
    });
  });
  describe('#generate', () => {
    it('has a generate method', () => {
      const c = new ControllerManager();
      expect(c).to.have.property('generate');
    });
    it('has a method generate which takes a quizName', () => {
      mockEnv('test', 'banana');
      const c = new ControllerManager();
      expect(c.generate.bind(c, 'test')).to.not.throw(Error);
    });
    it('creates a new controller file which is a copy of the controllerTemplate', () => {
      // create an empty directory for it to write to
      // check that that directory is empty
      const c = new ControllerManager();
      const text = Math.random();
      var controllerName = ['apple', 'banana', 'pear'][
        Math.floor(Math.random() * 3)
      ];
      mockEnv('another_controller', text);
      c.generate(controllerName);
      expect(fs.readdirSync.called).to.be.true;
      expect(fs.readdirSync.firstCall.args[0]).to.equal(
        path.resolve('./pushkin-api/controllers')
      );
      expect(fs.writeFileSync.called).to.be.true;
      expect(fs.writeFileSync.firstCall.args[0]).to.eq(
        path.resolve(`./pushkin-api/controllers/${controllerName}.js`)
      );
      expect(fs.readFileSync.called).to.be.true;
      expect(fs.readFileSync.firstCall.args).to.eql([
        path.resolve(__dirname, '../templates/controllers/controller.js'),
        'utf-8'
      ]);
      expect(fs.writeFileSync.firstCall.args[0]).to.eq(
        path.resolve(`./pushkin-api/controllers/${controllerName}.js`)
      );
      expect(fs.writeFileSync.firstCall.args[1]).to.eq(text);
      // call
      // check that that directory has a file with the controller name and that its contents match the templateController
    });
    it('shows a message if that controller file already exists', () => {
      const c = new ControllerManager();
      const templateText = Math.random();
      var controllerName = ['apple', 'banana', 'pear'][
        Math.floor(Math.random() * 3)
      ];
      mockEnv(controllerName, templateText);
      c.generate(controllerName);
      expect(logger.log.called).to.be.true;
      expect(
        logger.log.firstCall.args[0].includes(
          'Sorry there is already a controller'
        )
      ).to.be.true;
    });
  });
  describe('#delete', () => {
    it('has a delete method', () => {
      const c = new ControllerManager();
      expect(c).to.have.property('delete');
    });
    it('removes a controller if it exists', () => {
      const c = new ControllerManager();
      mockEnv('apple', 'template');
      c.delete('apple');
      expect(fs.unlinkSync.called).to.be.true;
      expect(fs.unlinkSync.firstCall.args[0]).to.eq(
        path.resolve('./pushkin-api/controllers/apple.js')
      );
    });
  });
});
