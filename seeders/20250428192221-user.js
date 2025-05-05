"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert("Users", [
			{
				nama: "Super Admin",
				email: "admin@test.com",
				password: bcrypt.hashSync("admin123", 10),
				role: "admin",
        telepon: "081234567890",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				nama: "Driver",
				email: "driver@test.com",
				password: bcrypt.hashSync("driver123", 10),
				role: "driver",
        telepon: "081234567891",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete("Users", null, {});
	},
};

