'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface) {
    await queryInterface.bulkInsert('Dokumen_Pengirimans', [
      {
        id_jadwal_pengiriman: 1,
        file_path: '/uploads/suratjalan001.pdf',
        catatan: 'Disahkan oleh kepala logistik',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('Dokumen_Pengirimans', null, {});
  }
};
