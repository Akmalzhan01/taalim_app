const express = require('express');
const router = express.Router();
const {
    getBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
} = require('../controllers/branchController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, checkPermission('branches'), getBranches)
    .post(protect, checkPermission('branches'), createBranch);

router.route('/:id')
    .get(protect, checkPermission('branches'), getBranchById)
    .put(protect, checkPermission('branches'), updateBranch)
    .delete(protect, checkPermission('branches'), deleteBranch);

module.exports = router;
