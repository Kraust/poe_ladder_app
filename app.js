const express = require('express');
const { Client } = require('pg');
const client = new Client({
	host: 'localhost',
	port: 5432,
	user: 'pi',
	password: 'raspberry',
	database: 'poe_ladder_data'
});
const index = require('./routes/index');

const app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static('public'))

app.get('/', index.body);

app.listen(3000);
