"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Order extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			Order.belongsTo(models.Customer, {
				foreignKey: "id_customer",
				as: "customer",
			});

			Order.hasMany(models.Order_Detail, {
				foreignKey: "id_order",
				as: "order_detail",
			});
		}
	}
	Order.init(
		{
			id_customer: DataTypes.INTEGER,
			jumlah: DataTypes.INTEGER,
			total_harga: DataTypes.DECIMAL,
			diskon: DataTypes.DECIMAL,
			pajak: DataTypes.DECIMAL,
			status: DataTypes.ENUM("pending", "scheduled", "shipped", "delivered"),
			tanggal_order: DataTypes.DATE,
		},
		{
			sequelize,
			modelName: "Order",
		}
	);
	return Order;
};

