const { Produk } = require("../models");

const getAllProduk = async (req, res) => {
	try {
		const produk = await Produk.findAll();
		res.status(200).json({
			message: "Produk retrieved successfully",
			data: produk,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getProdukById = async (req, res) => {
	try {
		const { id } = req.params;
		const produk = await Produk.findByPk(id);
		if (!produk) {
			return res.status(404).json({ message: "Produk not found" });
		}
		res.status(200).json({
			message: "Produk retrieved successfully",
			data: produk,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createProduk = async (req, res) => {
	try {
		const {
			kode_produk,
			nama,
			deskripsi,
			kategori,
			harga,
			tinggi,
			lebar,
			berat,
			panjang,
			status,
			stackable,
		} = req.body;
		const produk = await Produk.create({
			kode_produk,
			nama,
			deskripsi,
			kategori,
			harga,
			tinggi,
			lebar,
			berat,
			panjang,
			status,
			stackable,
		});
		res.status(201).json({
			message: "Produk created successfully",
			data: produk,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateProduk = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			kode_produk,
			nama,
			deskripsi,
			kategori,
			harga,
			tinggi,
			lebar,
			berat,
			panjang,
			status,
			stackable,
		} = req.body;
		const produk = await Produk.findByPk(id);
		if (!produk) {
			return res.status(404).json({ message: "Produk not found" });
		}
		produk.kode_produk = kode_produk;
		produk.nama = nama;
		produk.deskripsi = deskripsi;
		produk.kategori = kategori;
		produk.harga = harga;
		produk.tinggi = tinggi;
		produk.lebar = lebar;
		produk.panjang = panjang;
		produk.berat = berat;
		produk.status = status;
		produk.stackable = stackable;

		await produk.save();
		res.status(200).json({
			message: "Produk updated successfully",
			data: produk,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteProduk = async (req, res) => {
	try {
		const { id } = req.params;
		const produk = await Produk.findByPk(id);
		if (!produk) {
			return res.status(404).json({ message: "Produk not found" });
		}
		await produk.destroy();
		res.status(200).json({
			message: "Produk deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllProduk,
	getProdukById,
	createProduk,
	updateProduk,
	deleteProduk,
};
