"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("Kendaraans", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			nama: {
				type: Sequelize.STRING,
			},
			plat_nomor: {
				type: Sequelize.STRING,
			},
			tinggi: {
				type: Sequelize.DECIMAL,
			},
			panjang: {
				type: Sequelize.DECIMAL,
			},
			lebar: {
				type: Sequelize.DECIMAL,
			},
			kapasitas_volume: {
				type: Sequelize.INTEGER,
			},
			kapasitas_berat: {
				type: Sequelize.INTEGER,
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
		await queryInterface.dropTable("Kendaraans");
	},
};

