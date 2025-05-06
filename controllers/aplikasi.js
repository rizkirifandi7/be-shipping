const { Aplikasi } = require("../models");
const fs = require("fs");

const getAplikasi = async (req, res) => {
	try {
		const aplikasi = await Aplikasi.findAll();
		res.status(200).json({
			message: "Aplikasi retrieved successfully",
			data: aplikasi,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getAplikasiById = async (req, res) => {
	try {
		const { id } = req.params;
		const aplikasi = await Aplikasi.findByPk(id);
		if (!aplikasi) {
			return res.status(404).json({ message: "Aplikasi not found" });
		}
		res.status(200).json({
			message: "Aplikasi retrieved successfully",
			data: aplikasi,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createAplikasi = async (req, res) => {
	try {
		const { nama_perusahaan, alamat, telepon, email } = req.body;
		const logo = req.file ? req.file.path : null; // Assuming you are using multer for file upload
		const aplikasi = await Aplikasi.create({
			nama_perusahaan,
			alamat,
			telepon,
			email,
			logo,
		});
		res.status(201).json({
			message: "Aplikasi created successfully",
			data: aplikasi,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateAplikasi = async (req, res) => {
	try {
		const { id } = req.params;
		const { nama_perusahaan, alamat, telepon, email } = req.body;
		const logo = req.file ? req.file.path : null;

		const aplikasi = await Aplikasi.findByPk(id);

		if (!aplikasi) {
			return res.status(404).json({ message: "Aplikasi not found" });
		}

		// Hapus file logo lama jika ada file baru di-upload
		if (logo && aplikasi.logo && fs.existsSync(aplikasi.logo)) {
			fs.unlinkSync(aplikasi.logo);
		}

		aplikasi.nama_perusahaan = nama_perusahaan;
		aplikasi.alamat = alamat;
		aplikasi.telepon = telepon;
		aplikasi.email = email;
		if (logo) {
			aplikasi.logo = logo;
		}
		await aplikasi.save();
		res.status(200).json({
			message: "Aplikasi updated successfully",
			data: aplikasi,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteAplikasi = async (req, res) => {
	try {
		const { id } = req.params;
		const aplikasi = await Aplikasi.findByPk(id);
		if (!aplikasi) {
			return res.status(404).json({ message: "Aplikasi not found" });
		}
		await aplikasi.destroy();
		res.status(200).json({
			message: "Aplikasi deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAplikasi,
	getAplikasiById,
	createAplikasi,
	updateAplikasi,
	deleteAplikasi,
};
