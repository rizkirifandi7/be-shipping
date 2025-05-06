"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Produk extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
      Produk.hasMany(models.Order_Detail, {
        foreignKey: "id_produk",
        as: "order_detail",
      });
		}
	}
	Produk.init(
		{
			kode_produk: DataTypes.STRING,
			nama: DataTypes.STRING,
			deskripsi: DataTypes.TEXT,
			kategori: DataTypes.STRING,
			harga: DataTypes.DECIMAL,
			lebar: DataTypes.DECIMAL,
			panjang: DataTypes.DECIMAL,
			tinggi: DataTypes.DECIMAL,
			berat: DataTypes.DECIMAL,
			status: DataTypes.ENUM("active", "inactive"),
      stackable: DataTypes.ENUM("yes", "no"),
		},
		{
			sequelize,
			modelName: "Produk",
		}
	);
	return Produk;
};
