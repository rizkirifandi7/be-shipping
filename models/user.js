"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class User extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			User.hasMany(models.Jadwal_Pengiriman, {
				foreignKey: "id_driver",
				as: "jadwal_pengiriman",
			});

		}
	}
	User.init(
		{
			nama: DataTypes.STRING,
			email: DataTypes.STRING,
			password: DataTypes.STRING,
			role: DataTypes.ENUM("admin", "driver", "manager"),
			telepon: DataTypes.STRING,
			status: DataTypes.ENUM("active", "inactive"),
		},
		{
			sequelize,
			modelName: "User",
		}
	);
	return User;
};
