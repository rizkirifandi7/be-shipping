const router = require("express").Router();

const kendaraanRoutes = require("./kendaraan");
const authRoutes = require("./auth");
const userRoutes = require("./user");
const produkRoutes = require("./produk");
const customerRoutes = require("./customer");
const jadwalPengirimanRoutes = require("./jadwal_pengiriman");
const dokumenPengirimanRoutes = require("./dokumen_pengiriman");
const orderRoutes = require("./order");
const orderDetailRoutes = require("./order-detail");
const aplikasiRoutes = require("./aplikasi");

router.use("/kendaraan", kendaraanRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/produk", produkRoutes);
router.use("/customer", customerRoutes);
router.use("/jadwal-pengiriman", jadwalPengirimanRoutes);
router.use("/dokumen-pengiriman", dokumenPengirimanRoutes);
router.use("/order", orderRoutes);
router.use("/order-detail", orderDetailRoutes);
router.use("/aplikasi", aplikasiRoutes);

module.exports = router;
