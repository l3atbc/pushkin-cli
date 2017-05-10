const express = require('express');
const path = require('path');
const fs = require('fs');
const basicAuth = require('basic-auth');

const getFileName = () => {
  const fullPath = __filename;
  const fileName = fullPath.replace(/^.*[\\\/]/, '');
  return fileName.replace('.js', '').toLowerCase();
};

const fileName = getFileName();
const channelName = fileName + '_rpc_worker';

const checkUser = (username, password) => {
  const output = fs.readFileSync(path.resolve('./admin.txt'), 'utf-8');
  const outputArray = output.split('\n');
  const users = outputArray.map(currentEl => {
    return {
      username: currentEl.split(':')[0],
      password: currentEl.split(':')[1]
    };
  });
  return users.some(
    admin => admin.username === username && admin.password === password
  );
};
module.exports = (rpc, conn, dbWrite) => {
  const fileName = getFileName();
  const router = new express.Router();
  router.get('/initialQuestions', (req, res, next) => {
    var rpcInput = {
      method: 'getInitialQuestions'
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
    // create a channel
  });
  router.get('/responses', (req, res, next) => {
    // const { user, choiceId, questionId } = req.body;
    var rpcInput = {
      method: 'allResponses',
      params: []
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.post('/response', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    // save in db
    // ask for next
    // respond
    var rpcInput = {
      method: 'createResponse',
      params: [{ userId: user.id, choiceId }]
    };
    var findChoiceRPC = {
      method: 'findChoice',
      params: [req.body.choiceId]
    };
    return rpc(conn, channelName, findChoiceRPC)
      .then(choice => {
        return dbWrite(conn, fileName + '_db_write', rpcInput).then(() => {
          // this is going to the python worker so the payload is different
          var workerInput = {
            method: 'getQuestion',
            payload: {
              userId: user.id,
              questionId,
              choiceId,
              choice: choice
            }
          };
          return rpc(conn, 'task_queue', workerInput);
        });
      })
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.put('/users/:id', (req, res, next) => {
    var rpcInput = {
      method: 'updateUser',
      params: [req.params.id, req.body]
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/trials', (req, res, next) => {
    var rpcInput = {
      method: 'allTrials'
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/admincsv', (req, res, next) => {
    // TODO: refactor this to be set on contruction of the controller
    // possibly
    const user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    }
    if (checkUser(user.name, user.pass)) {
      const rpcInput = {
        method: 'getResponseCsv'
      };
      const channelName = fileName + '_rpc_worker';
      return rpc(conn, channelName, rpcInput)
        .then(data => {
          res.set('Content-Type', 'text/csv');
          res.send(data);
        })
        .catch(next);
    } else {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      res.sendStatus(401);
      return;
    }
  });
  router.get('/languages', (req, res, next) => {
    var rpcInput = {
      method: 'allLanguages'
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/users/:id', (req, res, next) => {
    var rpcInput = {
      method: 'findUser',
      params: [req.params.id, ['userLanguages.languages']]
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/results/:userId', (req, res, next) => {
    var workerInput = {
      method: 'getResults',
      payload: {
        userId: req.params.userId
      }
    };
    return rpc(conn, 'task_queue', workerInput)
      .then(data => {
        res.json({ results: data });
      })
      .catch(next);
  });
  router.post('/comments', (req, res, next) => {
    var rpcInput = {
      method: 'setUserLanguages',
      params: [
        req.body.userId,
        {
          nativeLanguages: req.body.nativeLanguages,
          primaryLanguages: req.body.primaryLanguages
        }
      ]
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        var rpc2 = {
          method: 'updateUser',
          params: [
            req.body.userId,
            {
              countriesOfResidence: req.body.countryOfResidence
                ? req.body.countryOfResidence.join(',')
                : null,
              englishYears: req.body.englishYears || null,
              householdEnglish: req.body.householdEnglish || null,
              learnAge: req.body.learnAge || null
            }
          ]
        };
        return rpc(conn, channelName, rpc2).then(data2 => {
          return res.json(Object.assign({}, data, data2));
        });
      })
      .catch(next);
  });
  return router;
};
