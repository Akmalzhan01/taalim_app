const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.underline.bold);
        process.exit(1);
    }
};

const createAdmin = async () => {
    try {
        await connectDB();

        const adminExists = await User.findOne({ email: 'admin@taalim.uz' });

        if (adminExists) {
            console.log('Admin user already exists!'.yellow.inverse);
            console.log('Email: admin@taalim.uz');
            // If you want to reset password, we could do it here, but let's assume if it exists they might know it or we can just tell them it exists.
            // Actually, for dev, let's force update password so we KNOW it's valid.
            adminExists.password = 'admin123';
            adminExists.isAdmin = true;
            await adminExists.save();
            console.log('Admin password reset to: admin123'.green.inverse);
        } else {
            const user = await User.create({
                name: 'Admin User',
                email: 'admin@taalim.uz',
                password: 'admin123',
                isAdmin: true,
            });
            console.log('Admin user created!'.green.inverse);
            console.log('Email: admin@taalim.uz');
            console.log('Password: admin123');
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

createAdmin();
