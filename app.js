// Required modules:
// =============================================
const Express = require("express");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const methodOverride = require("method-override");
const morgan = require("morgan");

// Setup the application:
// ==============================================
const app = Express();
const PORT = process.env.PORT || 8080;

// Setup the application to handle data parsing and http:
// ==============================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// Setup the applications favicon:
// ==============================================
app.use(favicon('./favicon.ico'));

// Set the apps view engine to pug.
app.set('view engine', 'pug');

// Send static files.
app.use('/static', Express.static('public'));

// Logger:
app.use(morgan('dev'));

// Require the router
const router = require('./routes');

// Use middleware to create the routes.
app.use(router);

// 404 error handling middleware.
app.use( ( req, res, next ) => {
    // Create a 404 error if the routes don't match an existing route.
    const err = new Error('page not found');
    err.status = 404;
    next(err);
}); 

// // Error handling middleware.
app.use( ( err, req, res, next ) => {
    res.locals.error = err;
    res.render('error');
});

// Require the database.
const db = require('./model');

db.sequelize.sync().then( () => {
    // Tell the app to listen on the desired port.
    app.listen(PORT, () => {
        console.log('Application listening on port', PORT);
    });
});