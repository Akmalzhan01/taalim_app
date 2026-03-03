const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/authMiddleware');
const {
    authUser,
    registerUser,
    googleAuth,
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    adminCreateUser,
} = require('../controllers/userController');

router.route('/').post(registerUser).get(protect, checkPermission('users'), getUsers);
router.post('/admin', protect, checkPermission('users'), adminCreateUser);
router.post('/login', authUser);
router.post('/google', googleAuth);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router
    .route('/:id')
    .delete(protect, checkPermission('users'), deleteUser)
    .get(protect, checkPermission('users'), getUserById)
    .put(protect, checkPermission('users'), updateUser);

module.exports = router;
