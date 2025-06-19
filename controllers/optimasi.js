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

const solver = require("javascript-lp-solver");

const createJadwalPengirimanDenganOptimasi = async (req, res) => {
	try {
		const {
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			catatan,
			id_orders,
			nomor_dokumen,
		} = req.body;

		const validationError = validateInput(
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			id_orders
		);
		if (validationError)
			return res.status(400).json({ message: validationError });

		const [driver, kendaraanList, orders] = await Promise.all([
			User.findOne({ where: { id: id_driver, role: "driver" } }),
			Kendaraan.findAll({ where: { status: "active" } }),
			Order.findAll({
				where: { id: id_orders, status: "pending" },
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

		if (!driver || !orders.length || !kendaraanList.length) {
			return res
				.status(400)
				.json({
					message: "Driver tidak valid atau tidak ada order/kendaraan.",
				});
		}

		const orderRequirements = calculateOrderRequirements(orders);
		const kendaraanCostMap = calculateKendaraanCosts(kendaraanList);
		const { constraints, variables, objective } = setupOptimizationModel(
			orders,
			kendaraanList,
			orderRequirements,
			kendaraanCostMap
		);

		const model = {
			optimize: objective,
			opType: "min",
			constraints,
			variables,
			binaries: Object.keys(variables),
		};
		const result = solver.Solve(model);

		if (!result.feasible) {
			console.log(
				"Hasil optimasi tidak feasible, menggunakan fallback algorithm"
			);
			return await fallbackAlgorithm(
				orders,
				kendaraanList,
				id_driver,
				tgl_pengiriman,
				perkiraan_sampai,
				catatan,
				nomor_dokumen,
				res
			);
		}

		const assignmentsByKendaraanId = processOptimizationResults(
			result,
			orders,
			orderRequirements,
			kendaraanList
		);
		const detailedVehiclePlacements = await createVehiclePlacements(
			assignmentsByKendaraanId
		);

		const allAssignedOrderIds = Object.values(assignmentsByKendaraanId).flatMap(
			(a) => a.orders.map((o) => o.id)
		);
		await Order.update(
			{ status: "scheduled" },
			{ where: { id: allAssignedOrderIds } }
		);

		const createdSchedules = await createSchedules(
			assignmentsByKendaraanId,
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			catatan,
			nomor_dokumen
		);
		await updateKendaraanAndDriverStatus(assignmentsByKendaraanId, id_driver);

		return res.status(201).json({
			message: `Jadwal Pengiriman berhasil dibuat dengan ${
				Object.keys(assignmentsByKendaraanId).length
			} kendaraan.`,
			data: createdSchedules,
			optimization: {
				totalKendaraanUsed: Object.keys(assignmentsByKendaraanId).length,
				kendaraanAssignments: Object.values(assignmentsByKendaraanId).map(
					(a) => ({
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
					})
				),
				vehicleProductPlacements: detailedVehiclePlacements,
			},
		});
	} catch (error) {
		console.error("Error:", error);
		return res.status(500).json({ message: "Terjadi kesalahan pada server." });
	}
};

const validateInput = (
	id_driver,
	tgl_pengiriman,
	perkiraan_sampai,
	id_orders
) => {
	if (
		!id_driver ||
		!tgl_pengiriman ||
		!perkiraan_sampai ||
		!Array.isArray(id_orders) ||
		id_orders.length === 0
	) {
		return "Driver, tanggal pengiriman, perkiraan sampai, dan id_orders wajib diisi.";
	}
	return null;
};

const calculateOrderRequirements = (orders) => {
	return orders.reduce((acc, order) => {
		const { totalBerat, totalVolume } = order.order_detail.reduce(
			(totals, detail) => {
				const { berat = 0, lebar = 0, panjang = 0, tinggi = 0 } = detail.produk;
				const volume =
					parseFloat(lebar) * parseFloat(panjang) * parseFloat(tinggi);
				totals.totalBerat += detail.jumlah * parseFloat(berat);
				totals.totalVolume += detail.jumlah * volume;
				return totals;
			},
			{ totalBerat: 0, totalVolume: 0 }
		);

		acc[order.id] = { totalBerat, totalVolume, customer: order.customer };
		return acc;
	}, {});
};

const calculateKendaraanCosts = (kendaraanList) => {
	return kendaraanList.reduce((acc, k) => {
		acc[k.id] =
			k.kapasitas_berat <= 1200
				? 1
				: k.kapasitas_berat <= 1500
				? 100
				: k.kapasitas_berat <= 2500
				? 1000
				: 10000;
		return acc;
	}, {});
};

const setupOptimizationModel = (
	orders,
	kendaraanList,
	orderRequirements,
	kendaraanCostMap
) => {
	const constraints = {};
	const variables = {};
	const objective = "total_cost";

	orders.forEach((order) => {
		constraints[`order_${order.id}`] = { equal: 1 };
		kendaraanList.forEach((kendaraan) => {
			const varName = `x_${order.id}_${kendaraan.id}`;
			const { totalBerat, totalVolume } = orderRequirements[order.id];
			if (
				totalBerat <= kendaraan.kapasitas_berat &&
				totalVolume <= kendaraan.kapasitas_volume
			) {
				variables[varName] = {
					[objective]: 0,
					[`order_${order.id}`]: 1,
					[`weight_${kendaraan.id}`]: totalBerat,
					[`volume_${kendaraan.id}`]: totalVolume,
				};
			}
		});
	});

	kendaraanList.forEach((kendaraan) => {
		const varName = `y_${kendaraan.id}`;
		variables[varName] = {
			[`used_${kendaraan.id}`]: 1,
			[objective]: kendaraanCostMap[kendaraan.id],
		};
		const assignVars = orders
			.map((order) => `x_${order.id}_${kendaraan.id}`)
			.filter((v) => variables[v]);
		if (assignVars.length > 0) {
			constraints[`assign_to_${kendaraan.id}`] = { max: 0 };
			assignVars.forEach((v) => {
				variables[v][`assign_to_${kendaraan.id}`] = 1;
			});
			variables[varName][`assign_to_${kendaraan.id}`] = -assignVars.length;
		}
	});

	return { constraints, variables, objective };
};

const processOptimizationResults = (
	result,
	orders,
	orderRequirements,
	kendaraanList
) => {
	const assignments = {};
	const orderMap = new Map(orders.map((order) => [order.id, order]));
	const kendaraanMap = new Map(kendaraanList.map((k) => [k.id, k]));

	for (const varName in result) {
		if (varName.startsWith("x_") && result[varName] === 1) {
			const [_, orderIdStr, kendaraanIdStr] = varName.split("_");
			const orderId = parseInt(orderIdStr);
			const kendaraanId = parseInt(kendaraanIdStr);

			if (!assignments[kendaraanId]) {
				assignments[kendaraanId] = {
					kendaraan: kendaraanMap.get(kendaraanId),
					orders: [],
					totalBerat: 0,
					totalVolume: 0,
				};
			}
			const order = orderMap.get(orderId);
			assignments[kendaraanId].orders.push(order);
			assignments[kendaraanId].totalBerat +=
				orderRequirements[orderId].totalBerat;
			assignments[kendaraanId].totalVolume +=
				orderRequirements[orderId].totalVolume;
		}
	}

	return assignments;
};

const createVehiclePlacements = async (assignmentsByKendaraanId) => {
	const placements = [];
	for (const kendaraanIdStr of Object.keys(assignmentsByKendaraanId)) {
		const { kendaraan, orders } = assignmentsByKendaraanId[kendaraanIdStr];
		const productBatches = createProductBatchesFromOrders(orders);
		const placementResult = placeProductsInVehicle(kendaraan, productBatches);
		placements.push({
			kendaraanId: parseInt(kendaraanIdStr),
			kendaraan: {
				id: kendaraan.id,
				nama: kendaraan.nama,
				plat_nomor: kendaraan.plat_nomor,
				kapasitas_berat: kendaraan.kapasitas_berat,
				kapasitas_volume: kendaraan.kapasitas_volume,
			},
			totalBeratAssigned: placementResult.totalBeratAssigned,
			totalVolumeAssigned: placementResult.totalVolumeAssigned,
			productPlacements: placementResult.placements,
			remainingWeightCapacity: placementResult.remainingWeightCapacity,
		});
	}
	return placements;
};

const createSchedules = async (
	assignmentsByKendaraanId,
	id_driver,
	tgl_pengiriman,
	perkiraan_sampai,
	catatan,
	nomor_dokumen
) => {
	const createSchedulePromises = Object.values(assignmentsByKendaraanId).map(
		async (a) => {
			const jadwal = await Jadwal_Pengiriman.create({
				order_ids: a.orders.map((o) => o.id),
				id_kendaraan: a.kendaraan.id,
				id_driver,
				tgl_pengiriman,
				perkiraan_sampai,
				catatan:
					catatan || `Pengiriman gabungan dengan ${a.orders.length} order`,
				status: "scheduled",
			});
			const nomorDok = nomor_dokumen || `SJ-${jadwal.id}-${Date.now()}`;
			const dokumen = await Dokumen_Pengiriman.create({
				nama_dokumen: `Surat Jalan Pengiriman #${jadwal.id}`,
				nomor_dokumen: nomorDok,
				catatan: `Otomatis dibuat untuk jadwal pengiriman #${jadwal.id}`,
				file_path: "-",
			});
			await jadwal.update({ id_dokumen_pengiriman: dokumen.id });
			return jadwal;
		}
	);
	return Promise.all(createSchedulePromises);
};

const updateKendaraanAndDriverStatus = async (
	assignmentsByKendaraanId,
	id_driver
) => {
	const assignedKendaraanIds = Object.keys(assignmentsByKendaraanId).map((id) =>
		parseInt(id)
	);
	await Promise.all([
		Kendaraan.update(
			{ status: "inactive" },
			{ where: { id: assignedKendaraanIds } }
		),
		User.update({ status: "inactive" }, { where: { id: id_driver } }),
	]);
};

const placeProductsInVehicle = (vehicle, productBatches) => {
	const vMaxWeight = parseFloat(vehicle.kapasitas_berat);
	let remainingWeightCapacity = vMaxWeight;
	const placements = [];
	const placedBoxes = [];

	const collides = (x, y, z, length, width, height) => {
		return placedBoxes.some(
			(box) =>
				!(
					x + length <= box.x ||
					box.x + box.length <= x ||
					y + width <= box.y ||
					box.y + box.width <= y ||
					z + height <= box.z ||
					box.z + box.height <= z
				)
		);
	};

	const findPosition = (length, width, height) => {
		const step = 0.1;
		for (let z = 0; z + height <= vehicle.tinggi; z += step) {
			for (let y = 0; y + width <= vehicle.lebar; y += step) {
				for (let x = 0; x + length <= vehicle.panjang; x += step) {
					if (!collides(x, y, z, length, width, height)) {
						return { x, y, z };
					}
				}
			}
		}
		return null;
	};

	productBatches.forEach((batch) => {
		let placeQty = Math.min(
			batch.qty,
			Math.floor(remainingWeightCapacity / batch.weight)
		);
		for (let i = 0; i < placeQty; i++) {
			const pos = findPosition(batch.length, batch.width, batch.height);
			if (!pos) break;

			placements.push({
				orderId: batch.orderId,
				productId: batch.productId,
				namaProduk: batch.namaProduk,
				position: pos,
				dimensions: {
					length: batch.length,
					width: batch.width,
					height: batch.height,
				},
			});

			placedBoxes.push({
				x: pos.x,
				y: pos.y,
				z: pos.z,
				length: batch.length,
				width: batch.width,
				height: batch.height,
			});
			remainingWeightCapacity -= batch.weight;
		}
	});

	return { placements, remainingWeightCapacity };
};

const createProductBatchesFromOrders = (orders) => {
	return orders.flatMap((order) =>
		order.order_detail.map((detail) => {
			const p = detail.produk;
			return {
				orderId: order.id,
				productId: p.id,
				namaProduk: p.nama,
				qty: detail.jumlah,
				length: parseFloat(p.panjang) || 0,
				width: parseFloat(p.lebar) || 0,
				height: parseFloat(p.tinggi) || 0,
				weight: parseFloat(p.berat) || 0,
				stackable: p.stackable === "yes",
			};
		})
	);
};

const fallbackAlgorithm = async (
	orders,
	kendaraanList,
	id_driver,
	tgl_pengiriman,
	perkiraan_sampai,
	catatan,
	nomor_dokumen,
	res
) => {
	try {
		const sortedOrders = [...orders].sort(
			(a, b) =>
				b.order_detail.reduce(
					(acc, d) => acc + d.jumlah * (parseFloat(d.produk.berat) || 0),
					0
				) -
				a.order_detail.reduce(
					(acc, d) => acc + d.jumlah * (parseFloat(d.produk.berat) || 0),
					0
				)
		);
		const sortedKendaraan = [...kendaraanList].sort(
			(a, b) => parseFloat(a.kapasitas_berat) - parseFloat(b.kapasitas_berat)
		);

		const assignments = [];
		let unassignedOrders = [...sortedOrders];

		for (const k of sortedKendaraan) {
			const assignment = {
				kendaraan: k,
				orders: [],
				totalBerat: 0,
				totalVolume: 0,
			};
			for (let i = 0; i < unassignedOrders.length; i++) {
				const o = unassignedOrders[i];
				const { totalBerat, totalVolume } = calculateOrderRequirements([o])[
					o.id
				];

				if (
					assignment.totalBerat + totalBerat <= k.kapasitas_berat &&
					assignment.totalVolume + totalVolume <= k.kapasitas_volume
				) {
					assignment.orders.push(o);
					assignment.totalBerat += totalBerat;
					assignment.totalVolume += totalVolume;
					unassignedOrders.splice(i, 1);
					i--;
				}
			}
			if (assignment.orders.length > 0) assignments.push(assignment);
		}

		if (unassignedOrders.length > 0) {
			return res
				.status(400)
				.json({
					message:
						"Tidak semua order dapat diassign ke kendaraan yang tersedia.",
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

		const createdSchedules = await createSchedules(
			assignments.reduce((acc, a) => {
				acc[a.kendaraan.id] = a;
				return acc;
			}, {}),
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			catatan,
			nomor_dokumen
		);
		await updateKendaraanAndDriverStatus(
			assignments.reduce((acc, a) => {
				acc[a.kendaraan.id] = a;
				return acc;
			}, {}),
			id_driver
		);

		return res.status(201).json({
			message: `Jadwal Pengiriman berhasil dibuat dengan ${assignments.length} kendaraan (fallback).`,
			data: createdSchedules,
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
};

module.exports = {
	createJadwalPengirimanDenganOptimasi,
};
