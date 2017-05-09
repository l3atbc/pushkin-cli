/* eslint-env mocha */
const chalk = require('chalk');
const expect = require('chai').expect;
const path = require('path');
var sinon = require('sinon');
const fs = require('fs-extra');
var proxyquire = require('proxyquire');
const logger = {
  log: sinon.stub(),
  error: console.log // eslint-disable-line no-console
};
const mockFs = {
  readdirSync: sinon.stub(),
  readFileSync: sinon.stub(),
  writeFileSync: sinon.stub(),
  mkdirSync: sinon.stub(),
  existsSync: sinon.stub(),
  unlink: sinon.stub()
};
const mockFse = {
  removeSync: sinon.stub()
};
const ModelManager = proxyquire('../src/modelManager', {
  './logger': logger,
  fs: mockFs,
  'fs-extra': mockFse
});
const inquirer = {
  prompt: sinon.stub()
};
const mockEnv = (model, migration, seed, modelText, migrationText) => {
  /* 
    This builds the following mock filesystem
    .
    └── pushkin-db
        ├── migrations
        │   └── dog.js
        |   - trials.js
        ├── models
        │   └── cat
        │       └── cat.js
        └── seeds
            └── parrot
                └── parrot.js
    */

  const deferred = sinon.stub().returns(true);
  const models = [model];
  const migrations = [migration];
  const seeds = [seed];
  const modelTemplates = [
    'choice.js',
    'question.js',
    'response.js',
    'trial.js',
    'user.js'
  ];
  const seedTemplates = [
    'Choices.csv',
    'index.js',
    'Questions.csv',
    'Trials.csv'
  ];
  const migrationTemplates = ['1_trials.js', '2_questions.js'];
  inquirer.prompt.callsFake(deferred, 'resolve').returns({ then: () => {} });
  mockFs.existsSync.withArgs(path.resolve('./pushkin-db')).returns(true);
  mockFs.existsSync
    .withArgs(path.resolve(`./pushkin-db/migrations/${migration}.js`))
    .returns(true);
  mockFs.existsSync
    .withArgs(path.resolve(`./pushkin-db/models/${model}`))
    .returns(true);
  mockFs.existsSync
    .withArgs(path.resolve(`./pushkin-db/seeds/${seed}`))
    .returns(true);
  mockFs.readdirSync
    .withArgs(path.resolve(`./pushkin-db/models`))
    .returns(models);
  mockFs.readdirSync
    .withArgs(path.resolve(`./pushkin-db/migrations`))
    .returns(migrations);
  mockFs.readdirSync
    .withArgs(path.resolve(`./pushkin-db/seeds`))
    .returns(seedTemplates);
  mockFs.readdirSync
    .withArgs(path.resolve(`./pushkin-db/models`))
    .returns(modelTemplates);
  mockFs.readFileSync
    .withArgs(
      path.resolve(__dirname, `../templates/models/${model}.js`),
      'utf-8'
    )
    .returns(modelText);
  migrationTemplates.forEach(template => {
    var mockPath = path.resolve(
      __dirname,
      `../templates/migrations/${template}`
    );
    var mockData = fs.readFileSync(
      path.resolve(__dirname, '../templates/migrations/', template),
      'utf-8'
    );
    mockFs.readFileSync.withArgs(mockPath, 'utf-8').returns(mockData);
  });
  seedTemplates.forEach(template => {
    var mockPath = path.resolve(__dirname, `../templates/seeds/${template}`);
    var mockData = fs.readFileSync(
      path.resolve(__dirname, '../templates/seeds/', template),
      'utf-8'
    );
    mockFs.readFileSync.withArgs(mockPath, 'utf-8').returns(mockData);
  });
  modelTemplates.forEach(template => {
    var mockPath = path.resolve(__dirname, `../templates/models/${template}`);
    var mockData = fs.readFileSync(
      path.resolve(__dirname, '../templates/models/', template),
      'utf-8'
    );
    mockFs.readFileSync.withArgs(mockPath, 'utf-8').returns(mockData);
  });
  mockFs.readdirSync
    .withArgs(path.resolve(__dirname, `../templates/seeds`))
    .returns(seedTemplates);
  mockFs.readdirSync
    .withArgs(path.resolve(__dirname, `../templates/models`))
    .returns(modelTemplates);
  mockFs.readdirSync
    .withArgs(path.resolve(__dirname, `../templates/migrations`))
    .returns(migrationTemplates);
  mockFs.readdirSync
    .withArgs(path.resolve(`./pushkin-db/seeds/${seed}`))
    .returns(seeds);
  mockFs.readFileSync
    .withArgs(
      path.resolve(__dirname, `../templates/seeds/migration1.js`),
      'utf-8'
    )
    .returns('migration1 content');
  mockFs.readFileSync
    .withArgs(path.resolve(__dirname, `../templates/models/model1.js`), 'utf-8')
    .returns('model1 content');
  mockFs.readFileSync
    .withArgs(path.resolve(__dirname, `../templates/seeds/seed1.js`), 'utf-8')
    .returns('seed1 content');
  mockFs.readFileSync
    .withArgs(
      path.resolve(__dirname, `../templates/migrations/migration1.js`),
      'utf-8'
    )
    .returns('migration1 content');
  mockFs.writeFileSync.callsFake(filename => {
    if (filename.includes('pushkin-db/seeds')) {
      seeds.push(filename);
    }
  });
  mockFs.writeFileSync.callsFake(filename => {
    if (filename.includes('pushkin-db/models')) {
      models.push(filename);
    }
  });
  mockFs.writeFileSync.callsFake(filename => {
    if (filename.includes('pushkin-db/migrations')) {
      migrations.push(filename);
    }
  });
};

describe('ModelManager', () => {
  beforeEach(() => {
    mockFs.writeFileSync.reset();
    logger.log.reset();
    mockFs.readdirSync.reset();
    mockFs.readFileSync.reset();
    mockFs.existsSync.reset();
    mockFse.removeSync.reset();
    inquirer.prompt.reset();
  });
  it('should exist', () => {
    expect(ModelManager).to.exist;
  });
  describe('#showList', () => {
    it('has a showList method', () => {
      const m = new ModelManager();
      expect(m).to.have.property('showList');
    });
    it('prints a list of existing models to the console', () => {
      const m = new ModelManager();
      mockEnv('cat', 'fish');
      m.showList();
      expect(logger.log.called).to.be.true;
      expect(logger.log.firstCall.args).to.eql(['choice']);
    });
  });

  describe('#checkMigrationDirectoryExists', () => {
    it('should exist', () => {
      const m = new ModelManager();
      expect(m).to.have.property('checkMigrationDirectoryExists');
    });
    it('should read ./pushkin-db/migrations directory', () => {
      const m = new ModelManager();
      mockEnv('cat', 'dog', 'fish');
      m.checkMigrationCollisions();
      expect(mockFs.readdirSync.called).to.be.true;
      expect(mockFs.readdirSync.firstCall.args[0]).to.eq(
        path.resolve('./pushkin-db/migrations')
      );
    });
  });
  describe('#checkModelDirectoryExists', () => {
    it('should exist', () => {
      const m = new ModelManager();
      expect(m).to.have.property('checkModelDirectoryExists');
    });
    it('should read ./pushkin-db/models directory', () => {
      const m = new ModelManager();
      mockEnv('cat', 'dog', 'fish');
      // m.name = 'cat';
      m.checkModelDirectoryExists();
      expect(mockFs.readdirSync.called).to.be.true;
      expect(mockFs.readdirSync.firstCall.args[0]).to.eq(
        path.resolve('./pushkin-db/models')
      );
    });
  });
  describe('#checkSeedDirectoryExists', () => {
    it('should exist', () => {
      const m = new ModelManager();
      expect(m).to.have.property('checkSeedDirectoryExists');
    });
    it('should read ./pushkin-db/seeds directory', () => {
      const m = new ModelManager();
      console.log('m', m);
      mockEnv('cat', 'dog', 'fish');
      m.checkSeedDirectoryExists();
      expect(mockFs.readdirSync.called).to.be.true;
      expect(mockFs.readdirSync.firstCall.args[0]).to.eq(
        path.resolve('./pushkin-db/seeds')
      );
    });
  });
  describe('#loadSeedTemplate', () => {
    it('should exist', () => {
      const m = new ModelManager();
      expect(m).to.have.property('loadSeedTemplate');
    });
    it('should read seed templates', () => {
      const m = new ModelManager();
      mockEnv(
        'cat',
        'dog',
        'fish',
        'catContent',
        'dogContent',
        'fishContent',
        'name'
      );
      m.loadSeedTemplate('test');
      expect(mockFs.readFileSync.called).to.be.true;
      expect(mockFs.readFileSync.firstCall.args[0]).to.eq(
        path.resolve(__dirname, `../templates/seeds/Choices.csv`),
        'utf-8'
      );
    });
    it('should write the seed templates to ./pushkin-db/seeds/test/seed1.js', () => {
      const m = new ModelManager();
      mockEnv('cat', 'dog', 'fish', 'catContent', 'dogContent', 'fishContent');
      // m.generate('test');
      m.name = 'test';
      m.loadSeedTemplate('test');
      expect(mockFs.writeFileSync.called).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[0]).to.eq(
        path.resolve(`./pushkin-db/seeds/test/Choices.csv`)
      );
    });
  });
  describe('#loadModelTemplate', () => {
    it('should exist', () => {
      const m = new ModelManager();
      expect(m).to.have.property('loadModelTemplate');
    });
    it('should read model templates', () => {
      const m = new ModelManager();
      mockEnv(
        'cat',
        'dog',
        'fish',
        'catContent',
        'dogContent',
        'fishContent',
        'name'
      );
      m.loadModelTemplate();
      m.name = 'test';
      expect(mockFs.readFileSync.called).to.be.true;
      expect(mockFs.readFileSync.firstCall.args[0]).to.eq(
        path.resolve(__dirname, `../templates/models/choice.js`),
        'utf-8'
      );
    });
    it('should write the seed templates to ./pushkin-db/seeds/test/seed1.js', () => {
      const m = new ModelManager();
      m.name = 'apple';
      mockEnv('cat', 'dog', 'fish', 'catContent', 'dogContent', 'fishContent');
      m.loadModelTemplate();
      expect(mockFs.writeFileSync.called).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[0]).to.eq(
        path.resolve(`./pushkin-db/models/apple/choice.js`)
      );
    });
  });
  describe('#generateMigrations', () => {
    it('has a generateMigrations method', () => {
      const m = new ModelManager();
      expect(m).to.have.property('generateMigrations');
    });
    it('creates new migrations for a quiz which are copies of migrationTemplate', () => {
      const m = new ModelManager();
      mockEnv(
        'cat',
        'trial',
        'fish',
        'catContent',
        'dogContent',
        'fishContent'
      );
      const templateData = fs.readFileSync(
        path.resolve(__dirname, '../templates/migrations/1_trials.js'),
        'utf-8'
      );
      const re = /.*create_parrot_trials\.js/g;
      m.name = 'parrot';

      m.generateMigrations();
      expect(mockFs.writeFileSync.called).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[0]).to.match(re);
      expect(mockFs.writeFileSync.firstCall.args[1]).to.eql(
        templateData.replace(/trials/g, 'parrot_trials')
      );
      // read the migrations templates
      // see if actual read data = data written to mock with the changes
    });
    it('shows a message if migrations for a quiz already exist', () => {
      const m = new ModelManager();
      mockEnv(
        'cat',
        'parrotparrot',
        'fish',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'parrotparrot';
      m.generateMigrations();
      expect(logger.log.called).to.be.true;
      expect(logger.log.firstCall.args[0]).to.eql(
        chalk.red('Sorry parrotparrot migrations already exist')
      );
    });
  });
  describe('#generateModels', () => {
    it('has a generateModels method', () => {
      const m = new ModelManager();
      expect(m).to.have.property('generateModels');
    });
    it('creates new models for a quiz which are copies of modelTemplate', () => {
      const m = new ModelManager();
      mockEnv(
        'cat',
        'trial',
        'fish',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'peach';
      const templateData = fs.readFileSync(
        path.resolve(__dirname, '../templates/models/choice.js'),
        'utf-8'
      );
      m.generateModels();
      expect(mockFs.writeFileSync.called).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[0]).to.eq(
        path.resolve('./pushkin-db/models/peach/choice.js')
      );
      expect(mockFs.writeFileSync.firstCall.args[1]).to.eql(
        templateData.replace(/choices/g, 'peach_choices')
      );
      // read the migrations templates
      // see if actual read data = data written to mock with the changes
    });
    it('shows a message if models for a quiz already exist', () => {
      const m = new ModelManager();
      mockEnv(
        'applesauce',
        'parrotMigrations',
        'fishSeeds',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'applesauce';
      m.generateModels();
      expect(m.checkCollisions('models')).to.be.true;
      expect(logger.log.called).to.be.true;
      expect(logger.log.firstCall.args[0]).to.eql(
        chalk.red('Sorry applesauce models already exist')
      );
    });
  });
  describe('#generateSeeds', () => {
    it('has a generateSeeds method', () => {
      const m = new ModelManager();
      expect(m).to.have.property('generateSeeds');
    });
    it('creates new seeds for a quiz which are copies of seedsTemplate', () => {
      const m = new ModelManager();
      mockEnv(
        'cat',
        'trial',
        'fish',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'peach';
      const templateData = fs.readFileSync(
        path.resolve(__dirname, '../templates/seeds/Choices.csv'),
        'utf-8'
      );
      m.generateSeeds();
      expect(mockFs.writeFileSync.called).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[0]).to.eq(
        path.resolve('./pushkin-db/seeds/peach/Choices.csv')
      );
      expect(mockFs.writeFileSync.firstCall.args[1]).to.eql(templateData);
    });
    it('shows a message if seeds for a quiz already exist', () => {
      const m = new ModelManager();
      mockEnv(
        'applesauce',
        'parrotMigrations',
        'fishSeeds',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'fishSeeds';
      m.generateSeeds();
      expect(m.checkCollisions('seeds')).to.be.true;
      expect(logger.log.called).to.be.true;
      expect(logger.log.firstCall.args[0]).to.eql(
        chalk.red('Sorry fishSeeds seeds already exist')
      );
    });
  });
  describe('#generate', () => {
    it('should call #generateSeeds, #generateModels, #generateMigrations', () => {
      const m = new ModelManager();
      mockEnv(
        'applesauce',
        'parrotMigrations',
        'fishSeeds',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.generate('fish');
      expect(m.generateMigrations).to.be.called;
      expect(m.generateModels).to.be.called;
      expect(m.generateSeeds).to.be.called;
    });
  });
  describe('#deleteMigrations', () => {
    it('has a deleteMigrations method', () => {
      const m = new ModelManager();
      expect(m).to.have.property('deleteMigrations');
    });
    it('logs an error message warning the user deleting a existing migration file is dangrous', () => {
      const m = new ModelManager();
      mockEnv(
        'applesauce',
        'parrotMigrations',
        'fishSeeds',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'parrotMigrations';
      m.deleteMigrations();
      expect(logger.log.called).to.be.true;
      expect(logger.log.firstCall.args[0]).to.eql(
        'destroyed parrotMigrations migrations'
      );
    });
  });
  describe('#deleteModels', () => {
    it('has a deleteModels method', () => {
      const m = new ModelManager();
      expect(m).to.have.property('deleteModels');
    });
    it('removes models files for a quiz if they exist', () => {
      const m = new ModelManager();
      mockEnv(
        'applesauce',
        'parrotMigrations',
        'fishSeeds',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'applesauce';
      m.deleteModels();
      expect(mockFse.removeSync.firstCall.args[0]).to.eql(
        path.resolve('./pushkin-db/models/applesauce')
      );
      expect(mockFse.removeSync.called).to.be.true;
    });
  });
  describe('#deleteSeeds', () => {
    it('has a deleteSeeds method', () => {
      const m = new ModelManager();
      expect(m).to.have.property('deleteSeeds');
    });
    it('removes seeds files for a quiz if they exist', () => {
      const m = new ModelManager();
      mockEnv(
        'applesauce',
        'parrotMigrations',
        'fishSeeds',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.name = 'fishSeeds';
      m.deleteSeeds();
      expect(mockFse.removeSync.firstCall.args[0]).to.eql(
        path.resolve('./pushkin-db/seeds/fishSeeds')
      );
      expect(mockFse.removeSync.called).to.be.true;
    });
  });
  describe('#delete', () => {
    it('should call #deleteSeeds, #deleteModels, #deleteMigrations', () => {
      const m = new ModelManager();
      mockEnv(
        'applesauce',
        'parrotMigrations',
        'fishSeeds',
        'catContent',
        'dogContent',
        'fishContent'
      );
      m.delete('fish');
      expect(m.deleteMigrations).to.be.called;
      expect(m.deleteModels).to.be.called;
      expect(m.deleteSeeds).to.be.called;
    });
  });
});
