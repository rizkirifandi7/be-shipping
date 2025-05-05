"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("Orders", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			id_customer: {
				type: Sequelize.INTEGER,
			},
			jumlah: {
				type: Sequelize.INTEGER,
			},
			total_harga: {
				type: Sequelize.DECIMAL,
			},
			diskon: {
				type: Sequelize.DECIMAL,
			},
			pajak: {
				type: Sequelize.DECIMAL,
			},
			status: {
				type: Sequelize.ENUM("pending", "scheduled", "shipped", "delivered"),
			},
			tanggal_order: {
				type: Sequelize.DATE,
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
		await queryInterface.dropTable("Orders");
	},
};

