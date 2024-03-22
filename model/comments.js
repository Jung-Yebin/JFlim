module.exports = function(sequelize, DataTypes){
    return sequelize.define('Comments',
    {
        idx : {
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey : true,
            allwNull:false
        },
        movieID:{
            type:DataTypes.INTEGER
        },
        comments:{
            type:DataTypes.STRING(500)
        }
    });
};