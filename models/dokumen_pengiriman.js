"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
	class Dokumen_Pengiriman extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			Dokumen_Pengiriman.belongsTo(models.Jadwal_Pengiriman, {
				foreignKey: "id_jadwal_pengiriman",
				as: "jadwal_pengiriman",
			});
		}
	}
	Dokumen_Pengiriman.init(
		{
			id_jadwal_pengiriman: DataTypes.INTEGER,
			file_path: DataTypes.STRING,
			catatan: DataTypes.TEXT,
		},
		{
			sequelize,
			modelName: "Dokumen_Pengiriman",
		}
	);
	return Dokumen_Pengiriman;
};
