const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional if using only Google
    googleId: { type: String },
    isAdmin: { type: Boolean, required: true, default: false },
    role: {
        type: String,
        required: true,
        enum: ['superadmin', 'manager', 'cashier'],
        default: 'cashier'
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    cashbackBalance: { type: Number, default: 0 },
    permissions: [String],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Keeping from previous project context if needed
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    // Only hash if password exists (google users might not have one)
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
