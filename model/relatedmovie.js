module.exports = function(sequelize, DataTypes){
    return sequelize.define('relatedmovie', {
        idx: {
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey : true,
            allwNull:false
        },
        movieID : {
            type : DataTypes.INTEGER
        },
        releatedmovieID : {
            type : DataTypes.STRING(1000)
        }
    })
}