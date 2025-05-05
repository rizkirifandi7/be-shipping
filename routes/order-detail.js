const router = require('express').Router();

const {
  getAllOrderDetails,
	getOrderDetailById,
	createOrderDetail,
	updateOrderDetail,
	deleteOrderDetail,
} = require('../controllers/order-detail');

router.get('/', getAllOrderDetails);
router.get('/:id', getOrderDetailById);
router.post('/', createOrderDetail);
router.put('/:id', updateOrderDetail);
router.delete('/:id', deleteOrderDetail);

module.exports = router;