const { Order, Customer, Order_Detail, Produk } = require("../models");
const { sequelize } = require("../models");

const getAllOrders = async (req, res) => {
	try {
		const orders = await Order.findAll({
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
		res.status(200).json({
			message: "Po Items retrieved successfully",
			data: orders,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getOrdersById = async (req, res) => {
	try {
		const { id } = req.params;
		const orders = await Order.findByPk(id, {
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
		if (!orders) {
			return res.status(404).json({ message: "Po Item not found" });
		}
		res.status(200).json({
			message: "Po Item retrieved successfully",
			data: orders,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createOrderWithDetails = async (req, res) => {
  try {
    const {
      id_customer,
      diskon,
      pajak,
			jumlah,
      total_harga,
      status,
      tanggal_order,
      produk
    } = req.body;

    const order = await sequelize.transaction(async (t) => {
      // 1. Buat OrderHeader
      const orderHeader = await Order.create(
        {
          id_customer,
          diskon,
          pajak,
					jumlah,
          total_harga,
          status,
          tanggal_order
        },
        { transaction: t }
      );

      // 2. Buat OrderDetail untuk setiap produk
      const orderDetails = await Promise.all(
        produk.map((item) =>
          Order_Detail.create(
            {
              id_order: orderHeader.id,
              id_produk: item.id_produk,
              jumlah: item.jumlah,
							harga: item.harga,
            },
            { transaction: t }
          )
        )
      );

      return { orderHeader, orderDetails };
    });

    res.status(201).json({
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const createOrders = async (req, res) => {
	try {
		const {
			id_customer,
			id_produk,
			jumlah,
			total_harga,
			diskon,
			pajak,
			catatan,
			status,
			tanggal_order,
		} = req.body;
		const orders = await Order.create({
			id_customer,
			id_produk,
			jumlah,
			total_harga,
			diskon,
			pajak,
			catatan,
			status,
			tanggal_order,
		});
		res.status(201).json({
			message: "Po Item created successfully",
			data: orders,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateOrders = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			id_customer,
			id_produk,
			jumlah,
			total_harga,
			diskon,
			pajak,
			catatan,
			status,
			tanggal_order,
		} = req.body;
		const orders = await Order.findByPk(id);
		if (!orders) {
			return res.status(404).json({ message: "Po Item not found" });
		}
		await orders.update({
			id_customer,
			id_produk,
			jumlah,
			total_harga,
			diskon,
			pajak,
			catatan,
			status,
			tanggal_order,
		});
		res.status(200).json({
			message: "Po Item updated successfully",
			data: orders,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteOrders = async (req, res) => {
	try {
		const { id } = req.params;
		const orders = await Order.findByPk(id);
		if (!orders) {
			return res.status(404).json({ message: "Po Item not found" });
		}
		await orders.destroy();
		res.status(200).json({
			message: "Po Item deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllOrders,
	getOrdersById,
	createOrders,
	updateOrders,
	deleteOrders,
	createOrderWithDetails,
};
