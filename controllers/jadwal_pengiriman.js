const {
	Jadwal_Pengiriman,
	Kendaraan,
	User,
	Order,
	Customer,
	Order_Detail,
	Produk,
} = require("../models");

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
			],
		});

		// Ambil semua order untuk setiap jadwal
		// ...existing code...
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
								attributes: ["id", "nama", "email", "telepon"],
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
						attributes: ["id", "nama", "email", "telepon"],
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
	try {
		const { id } = req.params;
		const {
			id_order,
			id_kendaraan,
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			catatan,
		} = req.body;
		const jadwalPengiriman = await Jadwal_Pengiriman.findByPk(id);
		if (!jadwalPengiriman) {
			return res.status(404).json({ message: "Jadwal Pengiriman not found" });
		}
		jadwalPengiriman.id_order = id_order;
		jadwalPengiriman.id_kendaraan = id_kendaraan;
		jadwalPengiriman.id_driver = id_driver;
		jadwalPengiriman.tgl_pengiriman = tgl_pengiriman;
		jadwalPengiriman.perkiraan_sampai = perkiraan_sampai;
		jadwalPengiriman.catatan = catatan;
		await jadwalPengiriman.save();
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
