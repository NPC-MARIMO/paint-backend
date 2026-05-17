const { createUser, loginUser, getProfile, getAllUsers } = require('../controllers/user.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const express = require('express')
const router = express.Router()

router.post('/register', createUser)
router.post('/login', loginUser)
router.get('/profile', authMiddleware, getProfile)
router.get('/', authMiddleware, adminMiddleware, getAllUsers)

module.exports = router