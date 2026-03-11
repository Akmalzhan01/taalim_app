const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const SupplyBatch = require('./models/SupplyBatch');
const Book = require('./models/Book');


mongoose.connect(process.env.MONGO_URI).then(async () => {
    const batches = await SupplyBatch.find({ quantity: { $gt: 0 } }).populate('book', 'title price');
    let cost = 0;
    let retail = 0;
    console.log('--- ACTIVE BATCHES ---');
    batches.forEach(b => {
        const itemCost = b.quantity * b.costPrice;
        const itemRetail = b.quantity * (b.book ? b.book.price : 0);
        cost += itemCost;
        retail += itemRetail;
        console.log(`- ${b.book ? b.book.title : 'Unknown'} | Qty: ${b.quantity} | BuyPrice: ${b.costPrice} | SellPrice: ${b.book ? b.book.price : 0} | TotalCost: ${itemCost} | TotalSell: ${itemRetail}`);
    });
    console.log('--- TOTALS ---');
    console.log(`COST: ${cost} | RETAIL: ${retail}`);
    process.exit(0);
}).catch(console.error);
