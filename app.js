const express = require('express');
//const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const app = express();
const ejs = require('ejs');
const db = require('./model/db');

app.set('view engine', 'ejs');
app.set('views', './views');
app.use('/public', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//app.use(helmet());
app.use(express.json());
app.use(express.urlencoded());
app.use(session({ secret: 'jungyebin', cookie: { maxAge: 60000, sameSite: 'strict',}, resave:true, saveUninitialized:true, store: new SequelizeStore({db : db.sequelize,}),}));

const mainRouter = require('./router/mainRouter');
app.use('/', mainRouter)

app.listen(3000, function(req, res){
    db.sequelize.sync({force:false})
    console.log("서버 실행중")
})
