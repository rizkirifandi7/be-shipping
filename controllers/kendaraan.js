const { Kendaraan } = require("../models");

const getAllKendaraan = async (req, res) => {
	try {
		const kendaraan = await Kendaraan.findAll();
		res.status(200).json({
			message: "Kendaraan retrieved successfully",
			data: kendaraan,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getKendaraanById = async (req, res) => {
	try {
		const { id } = req.params;
		const kendaraan = await Kendaraan.findByPk(id);
		if (!kendaraan) {
			return res.status(404).json({ message: "Kendaraan not found" });
		}
		res.status(200).json({
			message: "Kendaraan retrieved successfully",
			data: kendaraan,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createKendaraan = async (req, res) => {
	try {
		const {
			nama,
			plat_nomor,
			kapasitas_berat,
			tinggi,
			lebar,
			panjang,
			status,
		} = req.body;
		const kendaraan = await Kendaraan.create({
			nama,
			plat_nomor,
			kapasitas_volume: panjang * lebar * tinggi,
			kapasitas_berat,
			tinggi,
			lebar,
			panjang,
			status: status || "active",
		});
		res.status(201).json({
			message: "Kendaraan created successfully",
			data: kendaraan,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateKendaraan = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			nama,
			plat_nomor,
			kapasitas_berat,
			tinggi,
			lebar,
			panjang,
			status,
		} = req.body;
		const kendaraan = await Kendaraan.findByPk(id);
		if (!kendaraan) {
			return res.status(404).json({ message: "Kendaraan not found" });
		}
		kendaraan.nama = nama;
		kendaraan.plat_nomor = plat_nomor;
		kendaraan.kapasitas_volume = panjang * lebar * tinggi;
		kendaraan.kapasitas_berat = kapasitas_berat;
		kendaraan.tinggi = tinggi;
		kendaraan.lebar = lebar;
		kendaraan.panjang = panjang;
		kendaraan.status = status;

		await kendaraan.save();
		res.status(200).json({
			message: "Kendaraan updated successfully",
			data: kendaraan,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteKendaraan = async (req, res) => {
	try {
		const { id } = req.params;
		const kendaraan = await Kendaraan.findByPk(id);
		if (!kendaraan) {
			return res.status(404).json({ message: "Kendaraan not found" });
		}
		await kendaraan.destroy();
		res.status(204).json({
			message: "Kendaraan deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllKendaraan,
	getKendaraanById,
	createKendaraan,
	updateKendaraan,
	deleteKendaraan,
};

