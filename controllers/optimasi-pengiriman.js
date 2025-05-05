const {
	Jadwal_Pengiriman,
	Kendaraan,
	User,
	Order,
	Customer,
	Order_Detail,
	Produk,
} = require("../models");

const { Op } = require("sequelize");
const solver = require("javascript-lp-solver"); // Library untuk MILP

const createJadwalPengirimanDenganOptimasi = async (req, res) => {
	try {
		const { id_driver, tgl_pengiriman, perkiraan_sampai, catatan, id_orders } =
			req.body;

		// Validasi input
		if (
			!id_driver ||
			!tgl_pengiriman ||
			!perkiraan_sampai ||
			!id_orders ||
			!Array.isArray(id_orders) ||
			id_orders.length === 0
		) {
			return res.status(400).json({
				message:
					"Driver, tanggal pengiriman, perkiraan sampai, dan id_orders wajib diisi.",
			});
		}

		// Validasi driver dan load data in parallel
		const [driver, kendaraanList, orders] = await Promise.all([
			User.findOne({ where: { id: id_driver, role: "driver" } }),
			Kendaraan.findAll(),
			Order.findAll({
				where: {
					id: id_orders,
					status: "pending",
				},
				include: [
					{
						model: Order_Detail,
						as: "order_detail",
						include: [{ model: Produk, as: "produk" }],
					},
					{ model: Customer, as: "customer" },
				],
			}),
		]);

		// Validations
		if (!driver) {
			return res.status(400).json({
				message: "Driver tidak valid atau tidak ditemukan.",
			});
		}

		if (!orders.length || !kendaraanList.length) {
			return res.status(400).json({
				message: "Tidak ada order pending atau kendaraan tersedia",
			});
		}

		// Calculate order requirements once and store for reuse
		const orderRequirements = {};
		for (const order of orders) {
			let totalBerat = 0;
			let totalVolume = 0;

			for (const detail of order.order_detail) {
				const { berat = 0, lebar = 0, panjang = 0, tinggi = 0 } = detail.produk;
				const volume =
					parseFloat(lebar) * parseFloat(panjang) * parseFloat(tinggi);
				totalBerat += detail.jumlah * parseFloat(berat);
				totalVolume += detail.jumlah * volume;
			}

			orderRequirements[order.id] = {
				totalBerat,
				totalVolume,
				customer: order.customer,
			};
		}

		// --- PENAMBAHAN COST KENDARAAN UNTUK OPTIMASI LEBIH EFISIEN ---
		const kendaraanCostMap = {};
		kendaraanList.forEach((k) => {
			// Cost lebih kecil untuk kendaraan kecil
			if (k.kapasitas_berat <= 1200) kendaraanCostMap[k.id] = 1;
			else if (k.kapasitas_berat <= 1500) kendaraanCostMap[k.id] = 1.2;
			else if (k.kapasitas_berat <= 2500) kendaraanCostMap[k.id] = 1.5;
			else kendaraanCostMap[k.id] = 2; // 3 ton paling mahal
		});

		const constraints = {};
		const variables = {};
		const objective = "total_cost";

		// Setup order constraints - each order must be assigned to exactly one vehicle
		for (const order of orders) {
			constraints[`order_${order.id}`] = { equal: 1 };
		}

		// Setup capacity constraints for each vehicle
		for (const kendaraan of kendaraanList) {
			constraints[`weight_${kendaraan.id}`] = {
				max: kendaraan.kapasitas_berat,
			};
			constraints[`volume_${kendaraan.id}`] = {
				max: kendaraan.kapasitas_volume,
			};
		}

		// Assignment variables (x_{orderId}_{kendaraanId})
		for (const order of orders) {
			for (const kendaraan of kendaraanList) {
				const varName = `x_${order.id}_${kendaraan.id}`;
				const { totalBerat, totalVolume } = orderRequirements[order.id];

				// Skip creating variables for impossible assignments (early pruning)
				if (
					totalBerat > kendaraan.kapasitas_berat ||
					totalVolume > kendaraan.kapasitas_volume
				) {
					continue;
				}

				variables[varName] = {
					[objective]: 0, // cost diambil dari kendaraan, bukan dari assignment
					[`order_${order.id}`]: 1,
					[`weight_${kendaraan.id}`]: totalBerat,
					[`volume_${kendaraan.id}`]: totalVolume,
					[`assign_to_${kendaraan.id}`]: 1,
				};
			}
		}

		// Tambahkan variabel kendaraan digunakan (y_{kendaraanId})
		for (const kendaraan of kendaraanList) {
			const varName = `y_${kendaraan.id}`;
			variables[varName] = {
				[`used_${kendaraan.id}`]: 1,
				[objective]: kendaraanCostMap[kendaraan.id], // cost kendaraan
			};
		}

		// Constraint coupling: kendaraan hanya boleh "used" jika ada order yang di-assign
		for (const kendaraan of kendaraanList) {
			const assignVars = orders
				.map((order) => `x_${order.id}_${kendaraan.id}`)
				.filter((v) => variables[v]);
			if (assignVars.length > 0) {
				constraints[`assign_to_${kendaraan.id}`] = {
					max: assignVars.length,
				};
				assignVars.forEach((v) => {
					variables[v][`assign_to_${kendaraan.id}`] = 1;
				});
				variables[`y_${kendaraan.id}`][`assign_to_${kendaraan.id}`] =
					-assignVars.length;
			}
		}

		// Define LP model
		const model = {
			optimize: objective,
			opType: "min",
			constraints,
			variables,
			binaries: Object.keys(variables),
		};

		// Solve the optimization problem
		const result = solver.Solve(model);

		// Process results or use fallback
		if (!result.feasible) {
			console.log(
				"Hasil optimasi tidak feasible, menggunakan fallback algorithm"
			);

			// Transform data for fallback
			const orderData = orders.map((order) => {
				const { totalBerat, totalVolume } = orderRequirements[order.id];

				return {
					id: order.id,
					kode_order: order.kode_order || `ORDER_${order.id}`,
					totalBerat,
					totalVolume,
					items: order.order_detail.map((detail) => {
						const produk = detail.produk;
						const berat = parseFloat(produk.berat || 1);
						const volume =
							parseFloat(produk.panjang || 0.1) *
							parseFloat(produk.lebar || 0.1) *
							parseFloat(produk.tinggi || 0.1);

						return {
							id: produk.id,
							nama: produk.nama,
							berat,
							volume,
							jumlah: detail.jumlah,
						};
					}),
					customer: {
						id: order.customer.id,
						nama: order.customer.nama,
						alamat: order.customer.alamat,
						kota: order.customer.kota,
					},
				};
			});

			return await fallbackAlgorithm(
				orderData,
				kendaraanList,
				id_driver,
				tgl_pengiriman,
				perkiraan_sampai,
				catatan,
				res
			);
		}

		// Process optimization results efficiently
		const assignments = {};
		const orderMap = new Map(orders.map((order) => [order.id, order]));
		const kendaraanMap = new Map(kendaraanList.map((k) => [k.id, k]));

		for (const varName in result) {
			if (varName.startsWith("x_") && result[varName] === 1) {
				const [_, orderId, kendaraanId] = varName.split("_");

				if (!assignments[kendaraanId]) {
					assignments[kendaraanId] = {
						kendaraan: kendaraanMap.get(parseInt(kendaraanId)),
						orders: [],
						totalBerat: 0,
						totalVolume: 0,
					};
				}

				const order = orderMap.get(parseInt(orderId));
				assignments[kendaraanId].orders.push(order);
				assignments[kendaraanId].totalBerat +=
					orderRequirements[orderId].totalBerat;
				assignments[kendaraanId].totalVolume +=
					orderRequirements[orderId].totalVolume;
			}
		}

		// Update all assigned orders' status in batch
		const allAssignedOrderIds = Object.values(assignments).flatMap((a) =>
			a.orders.map((o) => o.id)
		);
		await Order.update(
			{ status: "scheduled" },
			{ where: { id: allAssignedOrderIds } }
		);

		// Create Jadwal_Pengiriman per kendaraan, each with array of order IDs
		const createSchedulePromises = Object.values(assignments).map((a) =>
			Jadwal_Pengiriman.create({
				order_ids: a.orders.map((o) => o.id), // <-- array of order IDs (pastikan sudah ada di migration & model)
				id_kendaraan: a.kendaraan.id,
				id_driver,
				tgl_pengiriman,
				perkiraan_sampai,
				catatan:
					catatan || `Pengiriman gabungan dengan ${a.orders.length} order`,
				status: "scheduled",
			})
		);

		const createdSchedules = await Promise.all(createSchedulePromises);

		// Return result
		return res.status(201).json({
			message: `Jadwal Pengiriman berhasil dibuat dengan ${
				Object.keys(assignments).length
			} kendaraan.`,
			data: createdSchedules.map((jadwal) => ({
				id: jadwal.id,
				id_kendaraan: jadwal.id_kendaraan,
				id_driver: jadwal.id_driver,
				tgl_pengiriman: jadwal.tgl_pengiriman,
				perkiraan_sampai: jadwal.perkiraan_sampai,
				catatan: jadwal.catatan,
				status: jadwal.status,
				order_ids: jadwal.order_ids, // tampilkan array order_ids
				createdAt: jadwal.createdAt,
				updatedAt: jadwal.updatedAt,
			})),
			optimization: {
				totalKendaraanUsed: Object.keys(assignments).length,
				kendaraanAssignments: Object.values(assignments).map((a) => ({
					kendaraan: {
						id: a.kendaraan.id,
						nama: a.kendaraan.nama,
						plat_nomor: a.kendaraan.plat_nomor,
					},
					totalOrders: a.orders.length,
					totalBerat: a.totalBerat,
					totalVolume: a.totalVolume,
					utilization: {
						berat: `${(
							(a.totalBerat / a.kendaraan.kapasitas_berat) *
							100
						).toFixed(2)}%`,
						volume: `${(
							(a.totalVolume / a.kendaraan.kapasitas_volume) *
							100
						).toFixed(2)}%`,
					},
				})),
			},
		});
	} catch (error) {
		console.error("Error:", error);
		return res.status(500).json({ message: "Terjadi kesalahan pada server." });
	}
};

// Fallback algorithm juga perlu disesuaikan:
async function fallbackAlgorithm(
	orderData,
	allKendaraan,
	id_driver,
	tgl_pengiriman,
	perkiraan_sampai,
	catatan,
	res
) {
	try {
		const sortedOrders = [...orderData].sort(
			(a, b) => b.totalBerat - a.totalBerat
		);
		const sortedKendaraan = [...allKendaraan].sort(
			(a, b) => b.kapasitas_berat - a.kapasitas_berat
		);

		const assignments = [];
		const unassignedOrders = [...sortedOrders];

		for (const k of sortedKendaraan) {
			const assignment = {
				kendaraan: k,
				orders: [],
				totalBerat: 0,
				totalVolume: 0,
			};

			for (let i = 0; i < unassignedOrders.length; i++) {
				const o = unassignedOrders[i];
				if (
					assignment.totalBerat + o.totalBerat <= k.kapasitas_berat &&
					assignment.totalVolume + o.totalVolume <= k.kapasitas_volume
				) {
					assignment.orders.push(o);
					assignment.totalBerat += o.totalBerat;
					assignment.totalVolume += o.totalVolume;
					unassignedOrders.splice(i, 1);
					i--;
				}
			}

			if (assignment.orders.length > 0) {
				assignments.push(assignment);
			}
		}

		if (unassignedOrders.length > 0) {
			return res.status(400).json({
				message: "Tidak semua order dapat diassign ke kendaraan yang tersedia.",
				unassignedOrders: unassignedOrders.map((o) => o.id),
			});
		}

		const allAssignedOrderIds = assignments.flatMap((a) =>
			a.orders.map((o) => o.id)
		);
		await Order.update(
			{ status: "scheduled" },
			{ where: { id: allAssignedOrderIds } }
		);

		const createdSchedules = [];
		for (const a of assignments) {
			const jadwal = await Jadwal_Pengiriman.create({
				order_ids: a.orders.map((o) => o.id), // <-- array of order IDs
				id_kendaraan: a.kendaraan.id,
				id_driver,
				tgl_pengiriman,
				perkiraan_sampai,
				catatan:
					catatan || `Pengiriman gabungan dengan ${a.orders.length} order`,
				status: "scheduled",
			});
			createdSchedules.push(jadwal);
		}

		return res.status(201).json({
			message: `Jadwal Pengiriman berhasil dibuat dengan ${assignments.length} kendaraan (fallback).`,
			data: createdSchedules.map((jadwal) => ({
				id: jadwal.id,
				id_kendaraan: jadwal.id_kendaraan,
				id_driver: jadwal.id_driver,
				tgl_pengiriman: jadwal.tgl_pengiriman,
				perkiraan_sampai: jadwal.perkiraan_sampai,
				catatan: jadwal.catatan,
				status: jadwal.status,
				order_ids: jadwal.order_ids,
				createdAt: jadwal.createdAt,
				updatedAt: jadwal.updatedAt,
			})),
			optimization: {
				totalKendaraanUsed: assignments.length,
				kendaraanAssignments: assignments.map((a) => ({
					kendaraan: {
						id: a.kendaraan.id,
						nama: a.kendaraan.nama,
						plat_nomor: a.kendaraan.plat_nomor,
					},
					totalOrders: a.orders.length,
					totalBerat: a.totalBerat,
					totalVolume: a.totalVolume,
					utilization: {
						berat: `${(
							(a.totalBerat / a.kendaraan.kapasitas_berat) *
							100
						).toFixed(2)}%`,
						volume: `${(
							(a.totalVolume / a.kendaraan.kapasitas_volume) *
							100
						).toFixed(2)}%`,
					},
				})),
			},
		});
	} catch (error) {
		console.error("Fallback error:", error);
		return res
			.status(500)
			.json({ message: "Terjadi kesalahan pada fallback algorithm." });
	}
}

module.exports = {
	createJadwalPengirimanDenganOptimasi,
};
