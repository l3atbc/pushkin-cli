# pushkin-cli

![Pushkin Logo](http://i.imgur.com/ncRJMJ5.png)

## Overview
The pushkin tool is created to easily generate or delete a set of routes, migrations, bookshelf models, seeds and workers for a new quiz.

## Install
npm install --global pushkin

## Get Started
* CD into your pushkin project folder
* open up your terminal and cd into your pushkin project folder
* Make sure your docker container is running, you could start it by executing  `docker-compose -f docker-compose.debug.yml up` in your pushkin folder
* execute commands by inputing `pushkin [action] [entity]`
* help is available by inputing `pushkin`

## Commands
| Command | Description |
| ------ | ------ |
| pushkin | list all pushkin commands |
| pushkin generate `entity` `yourQuizName` | creates an entity with desired name |
| pushkin delete `entity` `yourQuizName` | deletes an existing entity with name |
| pushkin list `entity` | list all entities |
| pushkin scaffold `yourQuizName` | genarates controller, model and worker |
| pushkin seed `yourQuizName` | list instructions for seeding an individual quiz |

## Examples
* Generate a model named whichenglish : `pushkin generate model whichenglish`
* Delete a controller named whichenglish : `pushkin delete controller whichenglish`
* Generate a complete set of whichenglish : `pushkin scaffold whichenglish`

## How does it work
The core of this cli tool are the manager files listed in `/src`. Each of them are responsible for three methods: `generate`, `delete` and `list`. 

Upon the command `pushkin [action] A B` where action is one of the methods, A is the entity and B is the name desired, pushkin simply calls the appropriate methods in the corresponding manager file. 

For example, `pushkin generate controller whichenglish` calls controllerManager's generate method to create a brand new controller file by coping `controller.js` in `/templates/controllesr` for quiz `whichenglish`.

## How to modify
- To change the methods created in the manager files, please edit the manager files, mainly in `controllerManager.js`, `modelManager.js`, and `workerManager.js`. Feel free to make changes to all the methods listed.

- To change the templates for `controllers`, `migrations`, `models`, `seeds` or `workers`, please edit the files listed under the `/templates` folder. Remember these templates are copied over to the desinated folder to put in action, please make sure any migration templates added or changed will take effect when running the migrations, the bookshelf model templates will also have to change correspondingly to proper establish the relations between all the tables. This is very important due to the fact that the routes heavily rely on these bookshelf models.

- To change the actual command handled by commander.js, please edit the files listed under `/bin`

## IMPORTANT! Migrations
Delete a model by `pushkin delete model [yourQuizname]` could be easily executed. 

This command will delete migration files, bookshelf model files and seed files for `[yourQuizName]`. Due to the nature of knex migrations, if you do not roll back these migrations before you execute delete, this WILL cause the migration folder to corrupt.

##### Things to do before deleting a model `pushkin delete model ...`
* make sure your docker is running
* bash into `pushkin-db-worker` :  `bash -c "clear && docker exec -it pushkin_db-worker_1 bash"`
* execute roll back by input `node_modules/.bin/knex migrate:rollback`

after the above steps are done, it is safe to delete a model.

##### If you've deleted a model without rolling back the migrations ...
Due to the fact that the only way to fix the corrupted migration folder issue is to drop the table that is causing the migration to corrupt, we STRONGLY RECOMMEND to back up your data on a daily basis. Here are the steps to drop a table: 
- bash into `pushkin-db` : `bash -c "clear && docker exec -it pushkin_db_1 sh"`
- input `psql --user postgres` to connect to psql
- connect to your database `\c [yourDataBaseName]`
- make sure you've backed up your data before dropping the table causing the corruption
- drop the table causing the corruption
- delete the migrations files causing the corruption

## Folder Structure
- `/bin` : handles shell commands by using commander.js Git-style sub-commands, for more info please visit https://github.com/tj/commander.js/
- `/src` : consists `controllerManager.js`, `modelManager.js`, `scaffoldManager.js` and `workerManager.js` which are in charge of coping the corresponding templates over to the desinated location
- `/templates` : consists template files for controller, migrations, models and seeds
- `/tests` : tests are written for all managers

## Tests
Tests are available for `Controllers`, `Controller Manager`, `Worker Manager` and `Model Managr`. You could add your own tests or modify existing test files by looking into the `pushkin-cli/test` folder. 

To run the tests : `npm run test` or `npm run test--watch` in `pushkin-cli` folder.

##### Test Libraries
* [Chai](http://chaijs.com/)
* [Sinon](http://sinonjs.org/)
* [Super-Test](https://github.com/visionmedia/supertest#supertest---)

## Main Plug-in
##### commander.js
- please visit https://github.com/tj/commander.js/ for more info

## Templates

### Python Worker

#### Overview
* python worker for data analysis
* reads responses from a user and returns a new question
* calculates results


#### Core Features
* `RPCClient` an easy way to get access to data without creating a bottleneck or a race condition
* `worker.py` the main startup script that coordinates responses and calls from the json api to the db.

RPCClient can be called in a similar fashion just like the JSON api, this works asynchronously so there is no hassles with promises or callbacks


```python
choice = client.call(json.dumps({
    'method': 'findChoice',
    'arguments': [1]
}))
```

#### Get started
Most of the code is in `worker.py` there is a simple `if` statement that handles whether or not the script is looking for the next question, or calculating the results.

the key difference between calculating results and searching for the next question is this:
When you ask for the next question, the worker calculates the next question, then tells **the db worker** to read it and pass it to the **api**
when you ask for the results, the worker calculates the results and **the worker** passes them to the api

#### How does it work
When generating a new worker by `pushkin generate worker [yourQuizName]`, it is : 
- added to the docker compose file
- each worker listens to task ques prefixed by [yourQuizName]

#### How to modify
New worker files generated could be found in `pushkin` folder. The folder name is prefixed by [yourQuizName] : `pushkin/[yourQuizName]-worker`. You could edit `index.py` within that folder.

#### Extension
I am not a python expert, any refactoring on this would be much appreciated.
