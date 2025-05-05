const { Customer } = require("../models");

const getAllCustomer = async (req, res) => {
	try {
		const customer = await Customer.findAll();
		res.status(200).json({
			message: "Customer retrieved successfully",
			data: customer,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getCustomerById = async (req, res) => {
	try {
		const { id } = req.params;
		const customer = await Customer.findByPk(id);
		if (!customer) {
			return res.status(404).json({ message: "Customer not found" });
		}
		res.status(200).json({
			message: "Customer retrieved successfully",
			data: customer,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createCustomer = async (req, res) => {
	try {
		const {
			kode_customer,
			nama,
			email,
			telepon,
			alamat,
			kota,
			provinsi,
			kode_pos,
		} = req.body;
		const customer = await Customer.create({
			kode_customer,
			nama,
			email,
			telepon,
			alamat,
			kota,
			provinsi,
			kode_pos,
		});
		res.status(201).json({
			message: "Customer created successfully",
			data: customer,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateCustomer = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			kode_customer,
			nama,
			email,
			telepon,
			alamat,
			kota,
			provinsi,
			kode_pos,
		} = req.body;
		const customer = await Customer.findByPk(id);
		if (!customer) {
			return res.status(404).json({ message: "Customer not found" });
		}
		customer.kode_customer = kode_customer;
		customer.nama = nama;
		customer.email = email;
		customer.telepon = telepon;
		customer.alamat = alamat;
		customer.kota = kota;
		customer.provinsi = provinsi;
		customer.kode_pos = kode_pos;
		await customer.save();
		res.status(200).json({
			message: "Customer updated successfully",
			data: customer,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteCustomer = async (req, res) => {
	try {
		const { id } = req.params;
		const customer = await Customer.findByPk(id);
		if (!customer) {
			return res.status(404).json({ message: "Customer not found" });
		}
		await customer.destroy();
		res.status(200).json({
			message: "Customer deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllCustomer,
	getCustomerById,
	createCustomer,
	updateCustomer,
	deleteCustomer,
};
