"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Customer extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			Customer.hasMany(models.Order, {
				foreignKey: "id_customer",
				as: "orders",
			});
		}
	}
	Customer.init(
		{
			kode_customer: DataTypes.STRING,
			nama: DataTypes.STRING,
			email: DataTypes.STRING,
			telepon: DataTypes.STRING,
			alamat: DataTypes.TEXT,
			kota: DataTypes.STRING,
			provinsi: DataTypes.STRING,
			kode_pos: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: "Customer",
		}
	);
	return Customer;
};
