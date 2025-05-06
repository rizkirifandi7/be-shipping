"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.bulkInsert(
			"Aplikasis",
			[
				{
					nama_perusahaan: "PT. Maju Mundur",
					alamat: "Jl. Raya No. 1, Jakarta",
					telepon: "021-12345678",
					email: "majumundur@gmail.com",
					logo: "logo.png",
          createdAt: new Date(),
          updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete("Aplikasis", null, {});
	},
};

