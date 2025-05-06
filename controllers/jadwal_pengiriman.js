const {
	Jadwal_Pengiriman,
	Kendaraan,
	User,
	Order,
	Customer,
	Order_Detail,
	Produk,
	Dokumen_Pengiriman,
} = require("../models");

const { sequelize } = require("../models");

const getAllJadwalPengiriman = async (req, res) => {
	try {
		const jadwalPengiriman = await Jadwal_Pengiriman.findAll({
			include: [
				{
					model: Kendaraan,
					as: "kendaraan",
				},
				{
					model: User,
					as: "driver",
					attributes: ["id", "nama", "email", "telepon"],
				},
				{
					model: Dokumen_Pengiriman,
					as: "dokumen_pengiriman",
					attributes: ["id", "nama_dokumen", "nomor_dokumen"],
				},
			],
		});

		const jadwalWithOrders = await Promise.all(
			jadwalPengiriman.map(async (jadwal) => {
				let orders = [];
				if (Array.isArray(jadwal.order_ids) && jadwal.order_ids.length > 0) {
					orders = await Order.findAll({
						where: { id: jadwal.order_ids },
						include: [
							{
								model: Customer,
								as: "customer",
							},
							{
								model: Order_Detail,
								as: "order_detail",
								include: [
									{
										model: Produk,
										as: "produk",
										// Anda bisa tambahkan attributes jika ingin membatasi field produk
									},
								],
							},
						],
					});
				}
				return {
					...jadwal.toJSON(),
					orders, // tampilkan array orders beserta detail produk
				};
			})
		);

		res.status(200).json({
			message: "Jadwal Pengiriman retrieved successfully",
			data: jadwalWithOrders,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getJadwalPengirimanById = async (req, res) => {
	try {
		const { id } = req.params;
		const jadwalPengiriman = await Jadwal_Pengiriman.findByPk(id, {
			include: [
				{
					model: Kendaraan,
					as: "kendaraan",
				},
				{
					model: User,
					as: "driver",
					attributes: ["id", "nama", "email", "telepon"],
				},
			],
		});

		if (!jadwalPengiriman) {
			return res.status(404).json({ message: "Jadwal Pengiriman not found" });
		}

		let orders = [];
		if (
			Array.isArray(jadwalPengiriman.order_ids) &&
			jadwalPengiriman.order_ids.length > 0
		) {
			orders = await Order.findAll({
				where: { id: jadwalPengiriman.order_ids },
				include: [
					{
						model: Customer,
						as: "customer",
					},
					{
						model: Order_Detail,
						as: "order_detail",
						include: [
							{
								model: Produk,
								as: "produk",
							},
						],
					},
				],
			});
		}

		res.status(200).json({
			message: "Jadwal Pengiriman retrieved successfully",
			data: {
				...jadwalPengiriman.toJSON(),
				orders, // tampilkan array orders beserta detail produk
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createJadwalPengiriman = async (req, res) => {
	try {
		const {
			id_order,
			id_kendaraan,
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			catatan,
		} = req.body;
		const jadwalPengiriman = await Jadwal_Pengiriman.create({
			id_order,
			id_kendaraan,
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			catatan,
		});
		res.status(201).json({
			message: "Jadwal Pengiriman created successfully",
			data: jadwalPengiriman,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateJadwalPengiriman = async (req, res) => {
	const transaction = await sequelize.transaction();
	try {
		const { id } = req.params;
		const {
			id_order,
			id_kendaraan,
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			status,
			catatan,
		} = req.body;
		const jadwalPengiriman = await Jadwal_Pengiriman.findByPk(id, {
			transaction,
		});
		if (!jadwalPengiriman) {
			await transaction.rollback();
			return res.status(404).json({ message: "Jadwal Pengiriman not found" });
		}

		// Update jadwal
		await jadwalPengiriman.update(
			{
				status: status,
				id_order: id_order,
				id_kendaraan: id_kendaraan,
				id_driver: id_driver,
				tgl_pengiriman: tgl_pengiriman,
				perkiraan_sampai: perkiraan_sampai,
				catatan: catatan,
			},
			{ transaction }
		);
		// Update status semua order yang terkait dengan jadwal ini
		if (status === "in_transit" || status === "completed") {
			const orderIds = jadwalPengiriman.order_ids || [];
			if (orderIds.length > 0) {
				await Order.update(
					{ status: status === "in_transit" ? "shipped" : "delivered" },
					{ where: { id: orderIds }, transaction }
				);
			}
		}

		// Debugging - log nilai sebelum update
		console.log("Before update - Status:", status);
		console.log("Kendaraan ID:", jadwalPengiriman.id_kendaraan);
		console.log("Driver ID:", jadwalPengiriman.id_driver);

		if (status === "completed") {
			if (jadwalPengiriman.id_kendaraan) {
				const [kendaraanUpdated] = await Kendaraan.update(
					{ status: "active" },
					{
						where: { id: jadwalPengiriman.id_kendaraan },
						transaction,
						individualHooks: true, // Lewati validasi/hook jika perlu
					}
				);
				console.log("Kendaraan update result:", kendaraanUpdated);
			}

			if (jadwalPengiriman.id_driver) {
				const [driverUpdated] = await User.update(
					{ status: "active" },
					{
						where: { id: jadwalPengiriman.id_driver },
						transaction,
						individualHooks: true,
					}
				);
				console.log("Driver update result:", driverUpdated);
			}
		}

		await transaction.commit(); // Commit transaction
		res.status(200).json({
			message: "Jadwal Pengiriman updated successfully",
			data: jadwalPengiriman,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteJadwalPengiriman = async (req, res) => {
	try {
		const { id } = req.params;
		const jadwalPengiriman = await Jadwal_Pengiriman.findByPk(id);
		if (!jadwalPengiriman) {
			return res.status(404).json({ message: "Jadwal Pengiriman not found" });
		}
		await jadwalPengiriman.destroy();
		res.status(200).json({	
			message: "Jadwal Pengiriman deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllJadwalPengiriman,
	getJadwalPengirimanById,
	createJadwalPengiriman,
	updateJadwalPengiriman,
	deleteJadwalPengiriman,
};
