"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("Produks", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			kode_produk: {
				type: Sequelize.STRING,
			},
			nama: {
				type: Sequelize.STRING,
			},
			deskripsi: {
				type: Sequelize.TEXT,
			},
			kategori: {
				type: Sequelize.STRING,
			},
			harga: {
				type: Sequelize.DECIMAL,
			},
			stok: {
				type: Sequelize.INTEGER,
			},
			lebar: {
				type: Sequelize.DECIMAL,
			},
			panjang: {
				type: Sequelize.DECIMAL,
			},
			tinggi: {
				type: Sequelize.DECIMAL,
			},
			berat: {
				type: Sequelize.DECIMAL,
			},
			status: {
				type: Sequelize.ENUM("active", "inactive"),
			},
			stackable: {
				type: Sequelize.ENUM("yes", "no"),
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
		await queryInterface.dropTable("Produks");
	},
};

