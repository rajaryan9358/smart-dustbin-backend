var express=require('express');
var bodyParser = require('body-parser');

const multer=require('multer');
const upload=multer();
var app=express();

var http = require('http').Server(app);

const successlog = require('./logger');

const { now } = require('moment');

var auth=require('./api/routes/auth.route');
var dustbin=require('./api/routes/dustbin.route');
var user=require('./api/routes/user.route');

var authConsumer=require('./api/routes/auth.consumer.route');


app.use(bodyParser.json());
app.use(upload.array());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/auth',auth);
app.use('/dustbin',dustbin);
app.use('/user',user);
app.use('/consumer/auth',authConsumer);


http.listen(3000,function(){
    console.log("Connected");
})