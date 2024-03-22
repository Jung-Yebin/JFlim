module.exports = function(sequelize, DataTypes){
    return sequelize.define('users', {
        idx: {
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey : true,
            allwNull:false
        },
        user_id:{
            type:DataTypes.STRING(100)
        },
        user_pwd:{
            type:DataTypes.STRING(100),
            allowNull:false
        }
    })
}