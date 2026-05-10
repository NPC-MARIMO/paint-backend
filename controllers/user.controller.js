const userModel = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createUser = async (req, res) => {
    try {
        const { name, email, password, number } = req.body;
        const existinguser = await userModel.findOne({ email })
        if (existinguser) {
            return res.status(400).json({ message: "user already exist" })

        }
        const hashepassword = await bcrypt.hash(password, 10)
        const user = await userModel.create({
            name,
            email,
            password: hashepassword,
            number
        })

        res.status(201).json({ message: "user created successfully ", user })
    }
    catch (err) {
        res.status(500).json({ message: "something went wrong", error: err.message })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res
            .status(200)
            .cookie("token", token, {
                httpOnly: true,
                sameSite: "lax",
                secure: false // true only on HTTPS
            })
            .json({
                message: "Login successful",
                user
            });
    }
    catch (err) {
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
}

module.exports = { createUser, loginUser };
