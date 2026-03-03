const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const resetPasswordForce = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`.cyan.underline);

        const email = 'admin@taalim.uz';
        const password = '123456';

        // 1. Generate Hash Manually
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Update directly in DB (Bypassing Mongoose Pre-save hooks to avoid double-hashing)
        const result = await User.updateOne(
            { email: email },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount > 0) {
            console.log(`SUCCESS: Password for ${email} forced to '${password}'`.green.bold);
        } else {
            console.log(`ERROR: User ${email} not found`.red.bold);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red);
        process.exit(1);
    }
};

resetPasswordForce();
