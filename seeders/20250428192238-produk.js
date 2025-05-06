"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.bulkInsert(
			"Produks",
			[
				{
					kode_produk: "PRD001",
					nama: "Laptop Gaming",
					deskripsi: "Laptop untuk gaming kelas berat",
					kategori: "Elektronik",
					harga: 2500000,
					berat: 2.2,
					panjang: 0.35,
					lebar: 0.25,
					tinggi: 0.02,
					status: "active",
					stackable: "yes",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_produk: "PRD002",
					nama: "Kulkas Mini",
					deskripsi: "Kulkas mini untuk menyimpan makanan",
					kategori: "Elektronik",
					harga: 85000,
					berat: 25,
					panjang: 0.5,
					lebar: 0.5,
					tinggi: 0.8,
					status: "active",
					stackable: "yes",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_produk: "PRD003",
					nama: "Papan",
					deskripsi: "Papan tulis putih",
					kategori: "Alat Tulis",
					harga: 150000,
					berat: 1.5,
					panjang: 1.2,
					lebar: 0.9,
					tinggi: 0.05,
					status: "active",
					stackable: "yes",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_produk: "PRD004",
					nama: "Kursi",
					deskripsi: "Kursi kayu",
					kategori: "Furniture",
					harga: 500000,
					berat: 5,
					panjang: 0.5,
					lebar: 0.5,
					tinggi: 1.0,
					status: "active",
					stackable: "yes",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_produk: "PRD005",
					nama: "Meja",
					deskripsi: "Meja kayu",
					kategori: "Furniture",
					harga: 1000000,
					berat: 10,
					panjang: 1.2,
					lebar: 0.8,
					tinggi: 0.75,
					status: "active",
					stackable: "yes",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface) {
		await queryInterface.bulkDelete("Produks", null, {});
	},
};

