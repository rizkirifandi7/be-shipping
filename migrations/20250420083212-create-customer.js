"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("Customers", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			kode_customer: {
				type: Sequelize.STRING,
			},
			nama: {
				type: Sequelize.STRING,
			},
			email: {
				type: Sequelize.STRING,
			},
			telepon: {
				type: Sequelize.STRING,
			},
			alamat: {
				type: Sequelize.TEXT,
			},
			kota: {
				type: Sequelize.STRING,
			},
			provinsi: {
				type: Sequelize.STRING,
			},
			kode_pos: {
				type: Sequelize.STRING,
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
		await queryInterface.dropTable("Customers");
	},
};
