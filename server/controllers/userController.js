const asyncHandler = require('express-async-handler'); // Simulating asyncHandler or just using checks
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            permissions: user.permissions,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            permissions: user.permissions,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Admin create a new user
// @route   POST /api/users/admin
// @access  Private/Admin
const adminCreateUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, branch, isAdmin, permissions } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Determine correct branch assignment
    const isSuperAdmin = req.user.role === 'superadmin' || req.user.isAdmin;
    const finalBranch = isSuperAdmin ? (branch || null) : req.user.branch;

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'cashier',
        branch: finalBranch,
        isAdmin: isAdmin || false,
        permissions: permissions || [],
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            branch: user.branch,
            permissions: user.permissions,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth with Google
// @route   POST /api/users/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
    const { email, name, googleId } = req.body;

    let user = await User.findOne({ email });

    if (user) {
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            permissions: user.permissions,
            token: generateToken(user._id),
        });
    } else {
        user = await User.create({
            name,
            email,
            googleId,
            password: '',
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                role: user.role,
                permissions: user.permissions,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            permissions: user.permissions,
            cashbackBalance: user.cashbackBalance,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;

        if (req.body.email && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                res.status(400);
                throw new Error('Email already already in use');
            }
            user.email = req.body.email;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            role: updatedUser.role,
            permissions: updatedUser.permissions,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    let query = {};

    // Branch Filter
    if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
        if (req.user.branch) {
            query.branch = req.user.branch._id || req.user.branch;
        }
    } else if (req.query.branch) {
        query.branch = req.query.branch;
    }

    const users = await User.find(query);
    res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!user.branch || user.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to delete this user from another branch');
            }
        }
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!user.branch || user.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to view this user from another branch');
            }
        }
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Branch Isolation Check
        if (req.user.role !== 'superadmin' && !req.user.isAdmin) {
            const userBranch = (req.user.branch._id || req.user.branch).toString();
            if (!user.branch || user.branch.toString() !== userBranch) {
                res.status(403);
                throw new Error('Not authorized to update this user from another branch');
            }
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        // user.isAdmin = req.body.isAdmin; // Fixed: Boolean check might fail if false, use explicit check if needed, but req.body.isAdmin is usually safe if passed
        if (req.body.isAdmin !== undefined) {
            user.isAdmin = req.body.isAdmin;
        }

        if (req.body.role) {
            user.role = req.body.role;
        }

        if (req.body.branch !== undefined) {
            user.branch = req.body.branch || null;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        if (req.body.permissions) {
            user.permissions = req.body.permissions;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            role: updatedUser.role,
            branch: updatedUser.branch,
            permissions: updatedUser.permissions,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
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
};
