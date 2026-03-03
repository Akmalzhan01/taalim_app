const mongoose = require('mongoose');
const Order = require('./controllers/orderController'); // This might not work directly as it exports functions, not model.
const OrderModel = require('./models/Order');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkStats = async () => {
    await connectDB();

    try {
        const totalOrders = await OrderModel.countDocuments();
        const paidOrders = await OrderModel.countDocuments({ isPaid: true });
        const recentPaidOrders = await OrderModel.find({
            isPaid: true,
            createdAt: {
                $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            }
        });

        console.log(`Total Orders: ${totalOrders}`);
        console.log(`Paid Orders: ${paidOrders}`);
        console.log(`Recent Paid Orders (last 12m): ${recentPaidOrders.length}`);

        if (recentPaidOrders.length > 0) {
            console.log('Sample Order Date:', recentPaidOrders[0].createdAt);
        }

    } catch (error) {
        console.error(error);
    }
    process.exit();
};

checkStats();
