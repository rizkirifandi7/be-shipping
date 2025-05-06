"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Kendaraan extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			Kendaraan.hasMany(models.Jadwal_Pengiriman, {
				foreignKey: "id_kendaraan",
				as: "jadwal_pengiriman",
			});
		}
	}
	Kendaraan.init(
		{
			nama: DataTypes.STRING,
			plat_nomor: DataTypes.STRING,
			tinggi: DataTypes.DECIMAL,
			lebar: DataTypes.DECIMAL,
			panjang: DataTypes.DECIMAL,
			kapasitas_berat: DataTypes.DECIMAL,
			kapasitas_volume: DataTypes.DECIMAL,
			status: DataTypes.ENUM("active", "inactive"),
		},
		{
			sequelize,
			modelName: "Kendaraan",
		}
	);
	return Kendaraan;
};

