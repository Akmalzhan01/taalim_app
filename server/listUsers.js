const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./models/User');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`.cyan.underline);

        const users = await User.find({});
        console.log('Users found:'.yellow);
        users.forEach(user => {
            console.log(`- ${user.name} (${user.email}) [Admin: ${user.isAdmin}]`);
        });

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red);
        process.exit(1);
    }
};

listUsers();
