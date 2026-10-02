const express = require('express');
require('dotenv').config()
const mysql = require('mysql');
var sha1 = require('sha1');
var cors = require('cors')

const app = express();
app.use(cors()) // Adds headers: Access-Control-Allow-Origin: *
const port = 5500;
const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306,
  database: 'weathercontrol',
  timezone: 'Europe/Budapest'
});

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
