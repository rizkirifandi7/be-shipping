"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("Dokumen_Pengirimans", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			nama_dokumen: {
				type: Sequelize.STRING,
			},
			nomor_dokumen: {
				type: Sequelize.STRING,
			},
			file_path: {
				type: Sequelize.STRING,
			},
			catatan: {
				type: Sequelize.TEXT,
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
		await queryInterface.dropTable("Dokumen_Pengirimans");
	},
};
