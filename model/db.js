var Sequelize = require("sequelize");
var sequelize;

sequelize = new Sequelize("jfilm", "root", "acb0519731",{
    host:"localhost",
    port:3306,
    dialect:"mysql",
    timezone:"+09:00",
    define:{
        charset:"utf8",
        collate:"utf8_general_ci",
        timestamps:true,
        freezeTableName:true
    }
})

var db = {};
const UserModel = require(__dirname + "/users.js");
const RatingModel = require(__dirname + "/rating.js");
const CommentsModel = require(__dirname + "/comments.js");
const RelatedMovieModel = require(__dirname + "/relatedmovie.js");

db.users = UserModel(sequelize, Sequelize);
db.rating = RatingModel(sequelize, Sequelize);
db.comments = CommentsModel(sequelize, Sequelize);
db.related = RelatedMovieModel(sequelize, Sequelize);

db.related.hasOne(db.rating, { foreignKey: 'MOVIEID' });

db.sequelize = sequelize;
db.Sequelize = sequelize;

module.exports = db;