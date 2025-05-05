"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkInsert(
            "Kendaraans",
            [
                {
                    nama: "Mobil Box 3 Ton",
                    plat_nomor: "B 1234 XYZ",
                    tinggi: 2.5,
                    lebar: 2.0,
                    panjang: 6.0,
                    kapasitas_berat: 3000,
                    kapasitas_volume: 30,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    nama: "Mobil Box Mini",
                    plat_nomor: "B 5678 ABC",
                    tinggi: 2.0,
                    lebar: 1.5,
                    panjang: 4.0,
                    kapasitas_berat: 1500,
                    kapasitas_volume: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    nama: "Mobil Box Ekspedisi",
                    plat_nomor: "B 9876 DEF",
                    tinggi: 1.8,
                    lebar: 1.7,
                    panjang: 3.5,
                    kapasitas_berat: 1000,
                    kapasitas_volume: 8,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    nama: "Mobil Box Engkel",
                    plat_nomor: "B 2468 GHI",
                    tinggi: 2.2,
                    lebar: 2.1,
                    panjang: 5.5,
                    kapasitas_berat: 2500,
                    kapasitas_volume: 20,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    nama: "Mobil Box Double Cabin",
                    plat_nomor: "B 1357 JKL",
                    tinggi: 1.9,
                    lebar: 1.8,
                    panjang: 4.2,
                    kapasitas_berat: 1200,
                    kapasitas_volume: 9,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("Kendaraans", null, {});
    },
};