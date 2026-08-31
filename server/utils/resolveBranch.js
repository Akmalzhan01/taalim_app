const Branch = require('../models/Branch');

// Determines which branch a newly created entity belongs to.
// Branch-scoped users always write into their own branch. Admins and superadmins
// may pass a branch explicitly (branch filter in the UI); when they don't and the
// system has a single branch, that one is used. Returns null when nothing can be
// resolved, so callers can answer 400 instead of failing model validation with 500.
const resolveBranchForCreate = async (req) => {
    const ownBranch = req.user.branch ? (req.user.branch._id || req.user.branch) : null;
    const isAdminUser = req.user.role === 'superadmin' || req.user.isAdmin;

    if (!isAdminUser) {
        return ownBranch;
    }

    const explicit = req.body.branch || req.query.branch;
    if (explicit) {
        return explicit;
    }
    if (ownBranch) {
        return ownBranch;
    }

    const branches = await Branch.find({}).select('_id').limit(2);
    return branches.length === 1 ? branches[0]._id : null;
};

module.exports = { resolveBranchForCreate };
