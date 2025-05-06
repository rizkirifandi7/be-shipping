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
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				nama: "Driver 1",
				email: "driver1@test.com",
				password: bcrypt.hashSync("driver123", 10),
				role: "driver",
				telepon: "081234567891",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				nama: "Driver 2",
				email: "driver2@test.com",
				password: bcrypt.hashSync("driver123", 10),
				role: "driver",
				telepon: "081234567892",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				nama: "Driver 3",
				email: "driver3@test.com",
				password: bcrypt.hashSync("driver123", 10),
				role: "driver",
				telepon: "081234567893",
				status: "active",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete("Users", null, {});
	},
};

