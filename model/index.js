// Required modules:
// ==================================
var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");
var basename  = path.basename(module.filename);
var env = process.env.NODE_ENV || 'development';
var config = require("../config/config.json")[env];

// Initialize database.
var db = {};

if(config.use_env_variable) {
    var sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
    var sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
    .readdirSync(__dirname) // Check each file in the directory.
    .filter( file => {
        // Make sure the file in the directory is a js file.
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach( file => {

        // For each file import the model.
        var model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach( modelName => {
    if(db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export the database.
module.exports = db;