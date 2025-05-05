"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Order_Detail extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
      Order_Detail.belongsTo(models.Order, {
        foreignKey: "id_order",
        as: "order",
      });
      Order_Detail.belongsTo(models.Produk, {
        foreignKey: "id_produk",
        as: "produk",
      });
		}
	}
	Order_Detail.init(
		{
			id_order: DataTypes.INTEGER,
			id_produk: DataTypes.INTEGER,
			jumlah: DataTypes.INTEGER,
			harga: DataTypes.DECIMAL,
		},
		{
			sequelize,
			modelName: "Order_Detail",
		}
	);
	return Order_Detail;
};

