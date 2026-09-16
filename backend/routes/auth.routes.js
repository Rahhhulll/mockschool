const express = require('express');

const { registerUser, loginUser } = require('../controllers/auth.controller');

const authMiddleware = require('../middleware/auth.middleware');

const authorizeRoles = require('../middleware/role.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', authMiddleware, (req, res) => {
    res.status(200).json({
        message: 'Profile accessed successfully',
        user: req.user
    });
});

router.get('/admin', authMiddleware, authorizeRoles('admin'), (req, res) => {
    res.status(200).json({
        message: 'Welcome Admin',
        user: req.user
    });
});

router.get('/mentor', authMiddleware, authorizeRoles('mentor'), (req, res) => {
    res.status(200).json({
        message: 'Welcome Mentor',
        user: req.user
    });
});


module.exports = router;