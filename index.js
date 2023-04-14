require('dotenv').config()

const express = require('express')
const app = express()
const exphbs = require("express-handlebars")
const flash = require('connect-flash');
const mysql = require('mysql')

app.set("view engine", "hbs")
app.engine("hbs", exphbs.engine({extname: "hbs"}))
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))

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

const routes = require('./routes/routes.js')
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