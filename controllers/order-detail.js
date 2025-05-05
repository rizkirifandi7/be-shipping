const { Order_Detail, Order, Produk } = require("../models");

const getAllOrderDetails = async (req, res) => {
	try {
		const orderDetails = await Order_Detail.findAll({
			include: [
				{
					model: Order,
					as: "order",
				},
				{
					model: Produk,
					as: "produk",
				},
			],
		});
		res.status(200).json({
			message: "Order Details retrieved successfully",
			data: orderDetails,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getOrderDetailById = async (req, res) => {
	try {
		const { id } = req.params;
		const orderDetail = await Order_Detail.findByPk(id, {
			include: [
				{
					model: Order,
					as: "order",
				},
				{
					model: Produk,
					as: "produk",
				},
			],
		});
		if (!orderDetail) {
			return res.status(404).json({ message: "Order Detail not found" });
		}
		res.status(200).json({
			message: "Order Detail retrieved successfully",
			data: orderDetail,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createOrderDetail = async (req, res) => {
	try {
		const { id_order, id_produk, jumlah, harga } = req.body;

		const orderDetail = await Order_Detail.create({
			id_order,
			id_produk,
			jumlah,
			harga,
		});
		res.status(201).json({
			message: "Order Detail created successfully",
			data: orderDetail,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateOrderDetail = async (req, res) => {
	try {
		const { id } = req.params;
		const { id_order, id_produk, jumlah, harga } = req.body;
		const orderDetail = await Order_Detail.findByPk(id);
		if (!orderDetail) {
			return res.status(404).json({ message: "Order Detail not found" });
		}
		orderDetail.id_order = id_order;
		orderDetail.id_produk = id_produk;
		orderDetail.jumlah = jumlah;
		orderDetail.harga = harga;
		await orderDetail.save();
		res.status(200).json({
			message: "Order Detail updated successfully",
			data: orderDetail,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteOrderDetail = async (req, res) => {
	try {
		const { id } = req.params;
		const orderDetail = await Order_Detail.findByPk(id);
		if (!orderDetail) {
			return res.status(404).json({ message: "Order Detail not found" });
		}
		await orderDetail.destroy();
		res.status(200).json({
			message: "Order Detail deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllOrderDetails,
	getOrderDetailById,
	createOrderDetail,
	updateOrderDetail,
	deleteOrderDetail,
};
