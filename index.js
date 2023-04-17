require('dotenv').config()

const express = require('express')
const app = express()
const exphbs = require("express-handlebars")
const flash = require('connect-flash');
const routes = require('./routes/routes0.js')
const mysql = require('mysql')
const path = require('path') 
app.set("view engine", "hbs")
app.engine("hbs", exphbs.engine({extname: "hbs",  partialsDir: path.join(__dirname,  "/views/partials"),}))
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))


/*
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "h03_db"
  });
  
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
*/
/*app.use(cors({
    origin: '*',
    methods: '*'
}));*/

/*app.use(session({
    secret: 'thehungrysibssecret',
    store: MongoStore.create({mongoUrl: 'mongodb://localhost:27017/ccapdev-mp'}),
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false, maxAge: 1000*60*60*24*21}
}))*/

app.use(flash());

/*app.use((req, res, next) => {
    res.locals.error_msg= req.flash('error_msg');
    next();
});*/

app.use(express.json())


app.use('/', routes)

/*
Handlebars.registerHelper('switch', function(value, options) {
    this.switch_value = value;
    this.switch_break = false;
    return options.fn(this);
    });

    Handlebars.registerHelper('case', function(value, options) {
    if (value == this.switch_value) {
        this.switch_break = true;
        return options.fn(this);
    }
    });
*/
app.listen(3000, () => console.log('Server Started'))