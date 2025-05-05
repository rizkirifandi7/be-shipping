"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Jadwal_Pengiriman extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			Jadwal_Pengiriman.belongsTo(models.Kendaraan, {
				foreignKey: "id_kendaraan",
				as: "kendaraan",
			});

			Jadwal_Pengiriman.belongsTo(models.User, {
				foreignKey: "id_driver",
				as: "driver",
			});

			Jadwal_Pengiriman.belongsTo(models.Order, {
				foreignKey: "id_order",
				as: "order",
			});

			Jadwal_Pengiriman.hasMany(models.Dokumen_Pengiriman, {
				foreignKey: "id_jadwal_pengiriman",
				as: "dokumen_pengiriman",
			});
		}
	}
	Jadwal_Pengiriman.init(
		{
			id_order: DataTypes.INTEGER,
			// model Jadwal_Pengiriman
			order_ids: {
				type: DataTypes.JSON,
				allowNull: false,
				defaultValue: [],
			},
			id_kendaraan: DataTypes.INTEGER,
			id_driver: DataTypes.INTEGER,
			tgl_pengiriman: DataTypes.DATE,
			perkiraan_sampai: DataTypes.DATE,
			catatan: DataTypes.TEXT,
			status: DataTypes.ENUM("scheduled", "in_transit", "completed"),
		},
		{
			sequelize,
			modelName: "Jadwal_Pengiriman",
		}
	);
	return Jadwal_Pengiriman;
};

