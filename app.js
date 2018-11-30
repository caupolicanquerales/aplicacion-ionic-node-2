var express=require('express');
var cors= require('cors');
var bodyParser= require('body-parser');
var validator= require('express-validator');
var morgan= require('morgan');
var rutas= require('./rutas/rutas');

var app= express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());
app.use(validator());
app.use(morgan('dev'));
app.use(rutas);
app.use(express.static('estaticos'));

app.listen(3000);