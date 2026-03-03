const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`.cyan.underline);

        const email = 'admin@taalim.uz';
        const password = '123456';

        // 1. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Update/Upsert Admin User
        const result = await User.findOneAndUpdate(
            { email: email },
            {
                $set: {
                    name: 'Admin User',
                    password: hashedPassword,
                    isAdmin: true,
                    email: email
                }
            },
            { new: true, upsert: true } // Create if doesn't exist
        );

        console.log(`Admin User: ${result.email} | isAdmin: ${result.isAdmin}`.yellow);

        // 3. Verify Login (Simulation)
        const isMatch = await bcrypt.compare(password, result.password);
        if (isMatch) {
            console.log(`LOGIN CHECK: SUCCESS! Password '${password}' is valid.`.green.bold);
        } else {
            console.log(`LOGIN CHECK: FAILED!`.red.bold);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red);
        process.exit(1);
    }
};

fixAdmin();
