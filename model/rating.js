module.exports = function(sequelize, DataTypes){
    return sequelize.define('Rating', 
    {
        idx: {
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey : true,
            allwNull:false
        },
        user_id:{
            type:DataTypes.STRING(100)
        },
        movieID:{
            type:DataTypes.INTEGER
        },
        rating: {
            type:DataTypes.INTEGER
        },
        posterImg : {
            type:DataTypes.STRING(200)
        },
        date : {
            type:DataTypes.STRING(50)
        },
        title : {
            type:DataTypes.STRING(100)
        },
        genre : {
            type:DataTypes.STRING(100)
        }
    });
};