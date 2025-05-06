"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("Jadwal_Pengirimans", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			id_dokumen_pengiriman: {
				type: Sequelize.INTEGER,
			},
			id_order: {
				type: Sequelize.INTEGER,
			},
			order_ids: {
				type: Sequelize.JSON,
				defaultValue: [],
			},
			id_kendaraan: {
				type: Sequelize.INTEGER,
			},
			id_driver: {
				type: Sequelize.INTEGER,
			},
			tgl_pengiriman: {
				type: Sequelize.DATE,
			},
			perkiraan_sampai: {
				type: Sequelize.DATE,
			},
			catatan: {
				type: Sequelize.TEXT,
			},
			status: {
				type: Sequelize.ENUM("scheduled", "in_transit", "completed"),
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("Jadwal_Pengirimans");
	},
};

