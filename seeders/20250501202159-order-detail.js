'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Order_Details', [
      {
        id_produk: 1,
        id_order: 1,
        harga: 100000,
        jumlah: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_produk: 2,
        id_order: 1,
        harga: 200000,
        jumlah: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_produk: 3,
        id_order: 2,
        harga: 150000,
        jumlah: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Order_Details', null, {});
  }
};
