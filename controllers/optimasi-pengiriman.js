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

const solver = require("javascript-lp-solver"); // Library untuk MILP

/**
 * Main controller method
 * Creates delivery schedules with optimization and detailed product placement in vehicles
 */
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

		// Validate input
		const validationError = validateInput(
			id_driver,
			tgl_pengiriman,
			perkiraan_sampai,
			id_orders
		);
		if (validationError) {
			return res.status(400).json({ message: validationError });
		}

		// Fetch driver, vehicles (active), orders (with details and customer)
		const [driver, kendaraanList, orders] = await Promise.all([
			User.findOne({ where: { id: id_driver, role: "driver" } }),
			Kendaraan.findAll({ where: { status: "active" } }),
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

		if (!driver) {
			return res
				.status(400)
				.json({ message: "Driver tidak valid atau tidak ditemukan." });
		}

		if (!orders.length || !kendaraanList.length) {
			return res
				.status(400)
				.json({ message: "Tidak ada order pending atau kendaraan tersedia" });
		}

		// Calculate order requirements (weight and volume)
		const orderRequirements = calculateOrderRequirements(orders);

		// Add vehicle cost map for optimization heuristic
		const kendaraanCostMap = calculateKendaraanCosts(kendaraanList);

		// Setup and solve MILP model to assign orders to vehicles (order-level optimization)
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

		// Process optimization results - get order to vehicle assignments
		const assignmentsByKendaraanId = processOptimizationResults(
			result,
			orders,
			orderRequirements,
			kendaraanList
		);

		// Now, for detailed product-level placement, aggregate all assigned orders per vehicle,
		// then assign their products spatially inside that vehicle.

		// Prepare response data structure including product placements
		const detailedVehiclePlacements = [];

		for (const kendaraanIdStr of Object.keys(assignmentsByKendaraanId)) {
			const kendaraanId = parseInt(kendaraanIdStr);
			const assignment = assignmentsByKendaraanId[kendaraanIdStr];
			const kendaraan = assignment.kendaraan;

			// Gather all orders' details assigned to this vehicle
			const assignedOrders = assignment.orders;

			// Break down assigned orders into product batches
			const productBatches = createProductBatchesFromOrders(assignedOrders);

			// Apply heuristic 3D placement inside this vehicle for these product batches
			const placementResult = placeProductsInVehicle(kendaraan, productBatches);

			// For simplicity, assume all assigned products fit; if not, fallback would handle
			detailedVehiclePlacements.push({
				kendaraanId,
				kendaraan: {
					id: kendaraan.id,
					nama: kendaraan.nama,
					plat_nomor: kendaraan.plat_nomor,
					kapasitas_berat: kendaraan.kapasitas_berat,
					kapasitas_volume: kendaraan.kapasitas_volume,
					panjang: kendaraan.panjang,
					lebar: kendaraan.lebar,
					tinggi: kendaraan.tinggi,
				},
				totalBeratAssigned: assignment.totalBerat,
				totalVolumeAssigned: assignment.totalVolume,
				productPlacements: placementResult.placements,
				remainingWeightCapacity: placementResult.remainingWeightCapacity,
			});
		}

		// Update all assigned orders' status in batch
		const allAssignedOrderIds = Object.values(assignmentsByKendaraanId).flatMap(
			(a) => a.orders.map((o) => o.id)
		);
		await Order.update(
			{ status: "scheduled" },
			{ where: { id: allAssignedOrderIds } }
		);

		// Create Jadwal_Pengiriman records per kendaraan
		const createSchedulePromises = Object.values(assignmentsByKendaraanId).map(
			(a) =>
				Jadwal_Pengiriman.create({
					order_ids: a.orders.map((o) => o.id),
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

		// Create Dokumen_Pengiriman for each schedule and update schedule record
		await Promise.all(
			createdSchedules.map(async (jadwal) => {
				const nomorDok = nomor_dokumen
					? nomor_dokumen
					: `SJ-${jadwal.id}-${Date.now()}`;
				const dokumen = await Dokumen_Pengiriman.create({
					nama_dokumen: `Surat Jalan Pengiriman #${jadwal.id}`,
					nomor_dokumen: nomorDok,
					catatan: `Otomatis dibuat untuk jadwal pengiriman #${jadwal.id}`,
					file_path: "-",
				});
				await jadwal.update({ id_dokumen_pengiriman: dokumen.id });
			})
		);

		// Update kendaraan and driver status
		await updateKendaraanAndDriverStatus(assignmentsByKendaraanId, id_driver);

		// Return detailed result including product placements per vehicle
		return res.status(201).json({
			message: `Jadwal Pengiriman berhasil dibuat dengan ${
				Object.keys(assignmentsByKendaraanId).length
			} kendaraan.`,
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

// Helper: validate input
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
		!id_orders ||
		!Array.isArray(id_orders) ||
		id_orders.length === 0
	) {
		return "Driver, tanggal pengiriman, perkiraan sampai, dan id_orders wajib diisi.";
	}
	return null;
};

// Helper: calculate order requirements (weight and volume)
const calculateOrderRequirements = (orders) => {
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
	return orderRequirements;
};

// Helper: calculate kendaraan costs for optimization
const calculateKendaraanCosts = (kendaraanList) => {
	const kendaraanCostMap = {};
	kendaraanList.forEach((k) => {
		if (k.kapasitas_berat <= 1200) kendaraanCostMap[k.id] = 1;
		else if (k.kapasitas_berat <= 1500) kendaraanCostMap[k.id] = 100;
		else if (k.kapasitas_berat <= 2500) kendaraanCostMap[k.id] = 1000;
		else kendaraanCostMap[k.id] = 10000;
	});
	return kendaraanCostMap;
};

// Helper: setup MILP optimization model for order to vehicle assignment
const setupOptimizationModel = (
	orders,
	kendaraanList,
	orderRequirements,
	kendaraanCostMap
) => {
	const constraints = {};
	const variables = {};
	const objective = "total_cost";

	for (const order of orders) {
		constraints[`order_${order.id}`] = { equal: 1 };
	}

	for (const kendaraan of kendaraanList) {
		constraints[`weight_${kendaraan.id}`] = { max: kendaraan.kapasitas_berat };
		constraints[`volume_${kendaraan.id}`] = { max: kendaraan.kapasitas_volume };
	}

	for (const order of orders) {
		for (const kendaraan of kendaraanList) {
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
		}
	}

	for (const kendaraan of kendaraanList) {
		const varName = `y_${kendaraan.id}`;
		variables[varName] = {
			[`used_${kendaraan.id}`]: 1,
			[objective]: kendaraanCostMap[kendaraan.id],
		};
	}

	for (const kendaraan of kendaraanList) {
		const assignVars = orders
			.map((order) => `x_${order.id}_${kendaraan.id}`)
			.filter((v) => variables[v]);
		if (assignVars.length > 0) {
			constraints[`assign_to_${kendaraan.id}`] = { max: 0 };
			assignVars.forEach((v) => {
				variables[v][`assign_to_${kendaraan.id}`] = 1;
			});
			variables[`y_${kendaraan.id}`][`assign_to_${kendaraan.id}`] =
				-assignVars.length;
		}
	}

	return { constraints, variables, objective };
};

// Helper: process MILP optimization results
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

/**
 * Creates product batches from orders.
 * Each batch represents one product type with quantity and dimensions.
 */
const createProductBatchesFromOrders = (orders) => {
	const batches = [];
	orders.forEach((order) => {
		order.order_detail.forEach((detail) => {
			const p = detail.produk;
			batches.push({
				orderId: order.id,
				productId: p.id,
				namaProduk: p.nama,
				qty: detail.jumlah,
				length: parseFloat(p.panjang) || 0,
				width: parseFloat(p.lebar) || 0,
				height: parseFloat(p.tinggi) || 0,
				weight: parseFloat(p.berat) || 0,
				stackable: p.stackable === "yes",
			});
		});
	});
	return batches;
};

/**
 * Heuristic 3D product placement in vehicle.
 * Tries to place products one by one in a simple spatial grid layout.
 * Returns placements with positions inside vehicle.
 */
const placeProductsInVehicle = (vehicle, productBatches) => {
	const vLength = parseFloat(vehicle.panjang);
	const vWidth = parseFloat(vehicle.lebar);
	const vHeight = parseFloat(vehicle.tinggi);
	const vMaxWeight = parseFloat(vehicle.kapasitas_berat);

	let remainingWeightCapacity = vMaxWeight;

	const placements = [];
	const placedBoxes = [];

	// Check collision with placed boxes
	function collides(x, y, z, length, width, height) {
		for (const box of placedBoxes) {
			if (
				!(
					x + length <= box.x ||
					box.x + box.length <= x ||
					y + width <= box.y ||
					box.y + box.width <= y ||
					z + height <= box.z ||
					box.z + box.height <= z
				)
			) {
				return true;
			}
		}
		return false;
	}

	// Find a free position for a box
	function findPosition(length, width, height) {
		const step = 0.1;
		for (let z = 0; z + height <= vHeight; z += step) {
			for (let y = 0; y + width <= vWidth; y += step) {
				for (let x = 0; x + length <= vLength; x += step) {
					if (!collides(x, y, z, length, width, height)) {
						return { x, y, z };
					}
				}
			}
		}
		return null;
	}

	for (const batch of productBatches) {
		// Check weight limit, partial packing allowed
		let maxQtyByWeight = Math.floor(remainingWeightCapacity / batch.weight);
		let placeQty = Math.min(batch.qty, maxQtyByWeight);
		if (placeQty <= 0) continue;

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
	}

	return { placements, remainingWeightCapacity };
};

// Helper: fallback algorithm (simplified first-fit for orders)
async function fallbackAlgorithm(
	orders,
	kendaraanList,
	id_driver,
	tgl_pengiriman,
	perkiraan_sampai,
	catatan,
	nomor_dokumen,
	res
) {
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
				order_ids: a.orders.map((o) => o.id),
				id_kendaraan: a.kendaraan.id,
				id_driver,
				tgl_pengiriman,
				perkiraan_sampai,
				catatan:
					catatan || `Pengiriman gabungan dengan ${a.orders.length} order`,
				status: "scheduled",
			});
			createdSchedules.push(jadwal);

			const nomorDok = nomor_dokumen
				? nomor_dokumen
				: `SJ-${jadwal.id}-${Date.now()}`;
			const dokumen = await Dokumen_Pengiriman.create({
				nama_dokumen: `Surat Jalan Pengiriman #${jadwal.id}`,
				nomor_dokumen: nomorDok,
				catatan: `Otomatis dibuat untuk jadwal pengiriman #${jadwal.id}`,
				file_path: "-",
			});
			await jadwal.update({ id_dokumen_pengiriman: dokumen.id });
		}

		await updateKendaraanAndDriverStatus(
			assignments.reduce((acc, a) => {
				acc[a.kendaraan.id] = a;
				return acc;
			}, {}),
			id_driver
		);

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

// Helper: update kendaraan and driver status
const updateKendaraanAndDriverStatus = async (
	assignmentsByKendaraanId,
	id_driver
) => {
	const assignedKendaraanIds = Object.keys(assignmentsByKendaraanId).map((id) =>
		parseInt(id)
	);
	await Kendaraan.update(
		{ status: "inactive" },
		{ where: { id: assignedKendaraanIds } }
	);
	await User.update({ status: "inactive" }, { where: { id: id_driver } });
};

module.exports = {
	createJadwalPengirimanDenganOptimasi,
};
