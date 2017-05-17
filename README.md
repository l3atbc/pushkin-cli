# pushkin-cli

![Pushkin Logo](http://i.imgur.com/ncRJMJ5.png)

## Overview
pushkin-cli tool is created to easily generate or delete a set of routes, migrations, bookshelf models, seeds and workers for a new quiz.

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
###### Generate a model named whichenglish :
`pushkin generate model whichenglish`
###### Delete a controller named whichenglish :
`pushkin delete controller whichenglish`
##### Generate a complete set of whichenglish :
`pushkin scaffold whichenglish`

## How does it work
The core of this cli tool are the manager files listed in `/src`. Each of them are responsible of three methods: `generate`, `delete` and `list`. Upon the command `pushkin [action] A B` where action is one of the methods, A is the entity and B is the name desired, pushkin-cli simply calls the appropriate methods in the corresponding manager file. For example, `pushkin generate controller whichenglish` calls controllerManager's generate method to create a brand new controller file by coping `controller.js` in `/templates/controllesr` for quiz `whichenglish`.

## How to modify
- to change the methods created in the manager files, please edit the manager files, mainly in `controllerManager.js`, `modelManager.js`, and `workerManager.js`. Feel free to make changes to all the methods listed.

- to change the templates for `controllers`, `migrations`, `models`, `seeds` or `workers`, please edit the files listed under the `/templates` folder. Remember these templates are copied over to the desinated folder to put in action, please make sure any migration templates added or changed will take effect when running the migrations, the bookshelf model templates will also have to change correspondingly to proper establish the relations between all the tables. This is very important due to the fact that the routes heavily rely on these bookshelf models.

- to change the actual command handled by commander.js, please edit the files listed under `/bin`

## IMPORTANT! Migrations
Delete a model by `pushkin delete model [yourQuizname]` could be easily executed. This command will delete migration files, bookshelf model files and seed files for `[yourQuizName]`. Due to the nature of knex migrations, if you do not roll back these migrations before you execute delete, this WILL cause the migration folder to corrupt.

##### Things to do before deleting a model `pushkin delete model ...`
* make sure your docker is running
* bash into `pushkin-db-worker` :  `bash -c "clear && docker exec -it pushkin_db-worker_1 sh"`
* execute roll back by input `node_modules/.bin/knex migrate:rollback`

after the above steps are done, it is safe to delete a model.

##### If you've deleted a model without rolling back the migrations ...
Due to the fact that the only way to fix the corrupted migration folder issue is to drop the table that is causing the migration to corrupt, we STRONGLY RECOMMEND to back up your data on a daily basis. Here are the steps to drop a table: 
- bash into `pushkin-db` : `bash -c "clear && docker exec -it pushkin_db_1 sh"`
- input psql --user postgres to connect to psql
- connect to your database `\c [yourDataBaseName]`
- make sure you've backed up your data before dropping the table causing the corruption
- drop the table causing the corruption
- delete the migrations files causing the corruption

## Folder Structure
- `/bin` : handles shell commands by using commander.js Git-style sub-commands, for more info please visit https://github.com/tj/commander.js/
- `/src` : consists `controllerManager.js`, `modelManager.js`, `scaffoldManager.js` and `workerManager.js` which are in charge of coping the corresponding templates over to the desinated location
- `/templates` : consists template files for controller, migrations, models and seeds
- `/tests` : tests are written for all managers

## Main Plug-in
##### commander.js
- please visit https://github.com/tj/commander.js/ for more info
