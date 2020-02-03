require('dotenv').config()
const express = require('express');
const Datastore = require('nedb');
const Axios = require('axios');
const Scrapper = require('./scrapper');
const logger = require('debug')('general');
const targets = {};

// Setup express
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup database
const db = new Datastore({ filename: './insta.db' });
db.ensureIndex({ fieldName: 'name', unique: true });
db.loadDatabase(() => {
  logger('Database has beed loaded, launching previous status');
  db.find({}, (err, trgts) => {
    for (let trgt of trgts) {
      targets[trgt.name] = new Scrapper(trgt.name);
      targets[trgt.name].scrapLoop();
    }
  });
});

// Setup routes
app.get('/', (req, res) => {
  return res.send('Scrapper endpoint');
});

app.post('/:username', async (req, res) => {
  const newTarget = req.params.username;

  try {
    await Axios.get(`https://www.instagram.com/${newTarget}`);
    db.insert({ name: newTarget }, (err) => {
      if (err) {
        return res.status(400).end();
      }
      targets[newTarget] = new Scrapper(newTarget);
      targets[newTarget].scrapLoop();
      logger(`New target added: ${newTarget}`);
      return res.status(200).end();
    });
  } catch (error) {
    return res.status(400).end();
  }
});

app.listen(port);
