const express = require("express");
const mongoose = require('mongoose');
var cors = require('cors');
const app = express();
const port = 8000;
require('dotenv').config();

var bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const routes = require('./routes');

app.use('/jotref', routes)

const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString);
const database = mongoose.connection;

const db = database.useDb('posts');

db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

app.get("/", function (req, res) {
  res.send("Hello stranger!");
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
