"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.bulkInsert(
			"Customers",
			[
				{
					kode_customer: "CUST001",
					nama: "PT Maju Jaya",
					email: "majujaya@email.com",
					telepon: "021123456",
					alamat: "Jl. Jaya Abadi No. 1",
					kota: "Jakarta",
					provinsi: "DKI Jakarta",
					kode_pos: "10110",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_customer: "CUST002",
					nama: "CV Sukses Selalu",
					email: "suksesselalu@email.com",
					telepon: "022654321",
					alamat: "Jl. Sukses No. 2",
					kota: "Bandung",
					provinsi: "Jawa Barat",
					kode_pos: "40211",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_customer: "CUST003",
					nama: "UD Makmur Sentosa",
					email: "makmursentosa@email.com",
					telepon: "031987654",
					alamat: "Jl. Sentosa No. 3",
					kota: "Surabaya",
					provinsi: "Jawa Timur",
					kode_pos: "60123",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_customer: "CUST004",
					nama: "PT Amanah Sejahtera",
					email: "amanahsejahtera@email.com",
					telepon: "024123789",
					alamat: "Jl. Amanah No. 4",
					kota: "Semarang",
					provinsi: "Jawa Tengah",
					kode_pos: "50145",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					kode_customer: "CUST005",
					nama: "CV Berkah Abadi",
					email: "berkahabadi@email.com",
					telepon: "027412345",
					alamat: "Jl. Berkah No. 5",
					kota: "Yogyakarta",
					provinsi: "DI Yogyakarta",
					kode_pos: "55281",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface) {
		await queryInterface.bulkDelete("Customers", null, {});
	},
};
