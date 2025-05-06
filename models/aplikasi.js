"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Aplikasi extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}
	Aplikasi.init(
		{
			nama_perusahaan: {
				type: DataTypes.STRING,
			},
			alamat: {
				type: DataTypes.TEXT,
			},
			telepon: {
				type: DataTypes.STRING,
			},
			email: {
				type: DataTypes.STRING,
			},
			logo: {
				type: DataTypes.STRING,
			},
		},
		{
			sequelize,
			modelName: "Aplikasi",
		}
	);
	return Aplikasi;
};
