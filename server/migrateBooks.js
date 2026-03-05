const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Book = require('./models/Book');
const Branch = require('./models/Branch');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const defaultBranch = await Branch.findOne({ name: 'Главный' });
        if (!defaultBranch) {
            console.error('Default branch "Главный" not found. Please create it first.');
            process.exit(1);
        }

        const result = await Book.updateMany(
            { branch: { $exists: false } },
            { $set: { branch: defaultBranch._id } }
        );

        console.log(`${result.modifiedCount} books updated with branch: ${defaultBranch.name}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

migrate();
