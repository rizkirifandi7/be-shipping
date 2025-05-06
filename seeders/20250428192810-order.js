"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface) {
		await queryInterface.bulkInsert(
			"Orders",
			[
				{
          id_customer: 1, // Customer A
					jumlah: 10,
					total_harga: 9500000,
					diskon: 100000,
					pajak: 50000,
          status: "pending",
          tanggal_order: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
          id_customer: 2, // Customer B
					jumlah: 20,
					total_harga: 85000,
					diskon: 5000,
					pajak: 5000,
          status: "pending",
          tanggal_order: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface) {
		await queryInterface.bulkDelete("Orders", null, {});
	},
};

