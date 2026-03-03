const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            req.user = await User.findById(decoded.id)
                .select('-password')
                .populate('branch');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const admin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.role === 'superadmin' || req.user.role === 'manager')) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'superadmin' || req.user.isAdmin)) {
        next();
    } else {
        res.status(403);
        throw new Error('Access denied: SuperAdmin only');
    }
};

const manager = (req, res, next) => {
    if (req.user && (req.user.role === 'manager' || req.user.role === 'superadmin' || req.user.isAdmin)) {
        next();
    } else {
        res.status(403);
        throw new Error('Access denied: Manager only');
    }
};

const checkPermission = (permissionId) => {
    return (req, res, next) => {
        const requiredPermissions = Array.isArray(permissionId) ? permissionId : [permissionId];

        if (req.user && (
            req.user.isAdmin ||
            req.user.role === 'superadmin' ||
            (Array.isArray(req.user.permissions) && requiredPermissions.some(pid => req.user.permissions.includes(pid)))
        )) {
            next();
        } else {
            res.status(403);
            throw new Error(`Access denied: Required permission '${requiredPermissions.join(',')}'`);
        }
    };
};

module.exports = { protect, admin, superAdmin, manager, checkPermission };
