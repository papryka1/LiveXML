if(process.env.NODE_ENV != 'production') {
    require('dotenv').config()
} 

const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const mongoose = require('mongoose')
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('passport')
const ajax = require('ajax')
var jsdom = require("jsdom");
const methodOverride = require('method-override')

const app = express()

// Passport config
require('./config/passport')(passport)

// Connect to Mongo
mongoose.connect(process.env.DATABASE_URL, { 
    useNewUrlParser: true,
    useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err))

// EJS
app.use(expressLayouts)
app.set('view engine', 'ejs')

// Bodyparser
app.use(express.urlencoded({ extended: true }))

// Method Override
app.use(methodOverride('_method'))

// Express Session
app.use(session({
    secret: 'kebabas',
    resave: true,
    saveUninitialized: true
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())
app.use((req, res, next) => {
    res.locals.login = req.isAuthenticated();
    next();
});

// Connect flash
app.use(flash())

// jQuery configuration
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
var $ = require("jquery")(window);

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})

// Routers
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))
app.use('/datatables', require('./routes/datatables'))
app.use('/admin', require('./routes/admin'))
app.use('/public', require('./routes/public'))

// The 404 Route
app.get('*', function(req, res){
    res.status(404).render('pagenotfound');
});

const PORT = process.env.PORT || 3000

app.listen(PORT, console.log(`Server started on port ${PORT}`))

//logger.error(`400 || ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`);