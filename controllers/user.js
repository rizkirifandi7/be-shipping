const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const getAllUser = async (req, res) => {
	try {
		const user = await User.findAll();
		res.status(200).json({
			message: "User retrieved successfully",
			data: user,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getUserById = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findByPk(id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.status(200).json({
			message: "User retrieved successfully",
			data: user,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createUser = async (req, res) => {
	try {
		const { username, password, role } = req.body;
		const user = await User.create({
			username,
			password,
			role,
		});
		res.status(201).json({
			message: "User created successfully",
			data: user,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, password, retypePassword, role, telepon } = req.body;

    // Validasi input dasar
    if (!nama || !email || !role || !telepon) {
      return res.status(400).json({
        message: "Nama, email, role, dan telepon harus diisi",
        status: false,
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
        status: false,
      });
    }

    // Jika ada password yang diinput (ingin mengubah password)
    if (password || retypePassword) {
      if (!password || !retypePassword) {
        return res.status(400).json({
          message: "Kedua field password harus diisi jika ingin mengubah password",
          status: false,
        });
      }

      if (password !== retypePassword) {
        return res.status(400).json({
          message: "Password tidak sama",
          status: false,
        });
      }

      // Hash password baru
      const hashedPassword = bcrypt.hashSync(password, 10);
      user.password = hashedPassword;
    }

    // Update field lainnya
    user.nama = nama;
    user.email = email;
    user.role = role;
    user.telepon = telepon;

    await user.save();

    // Jangan kembalikan password dalam response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      status: true,
      message: "User berhasil diupdate",
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      status: false,
    });
  }
};

const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await User.findByPk(id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		await user.destroy();
		res.status(200).json({
			message: "User deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllUser,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
};
