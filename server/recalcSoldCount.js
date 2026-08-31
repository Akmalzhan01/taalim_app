// One-off: rebuild Book.soldCount from order history.
//
//   node recalcSoldCount.js           # dry run, prints what would change
//   node recalcSoldCount.js --apply   # writes the new values
//
// Orders increment soldCount as they are placed, so this is only needed to
// account for sales made before that counter existed, or to repair drift.

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const apply = process.argv.includes('--apply');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const Book = require('./models/Book');
    const Order = require('./models/Order');

    const orders = await Order.find({
        isPaid: true,
        isRefunded: { $ne: true },
        isCancelled: { $ne: true }
    }).select('items').lean();

    // productId -> units sold, counting bundle contents the way a sale does
    const sold = new Map();
    const add = (id, qty) => sold.set(String(id), (sold.get(String(id)) || 0) + qty);

    for (const order of orders) {
        for (const item of order.items) {
            const book = await Book.findById(item.product).select('isBundle bundleItems').lean();
            if (!book) continue;

            add(item.product, item.qty);
            if (book.isBundle && book.bundleItems) {
                for (const bItem of book.bundleItems) {
                    add(bItem.product, bItem.qty * item.qty);
                }
            }
        }
    }

    const books = await Book.find({}).select('title soldCount').lean();
    const changes = books
        .map(b => ({ book: b, next: sold.get(String(b._id)) || 0 }))
        .filter(c => c.next !== (c.book.soldCount || 0));

    console.log(`orders counted: ${orders.length}`);
    console.log(`books needing an update: ${changes.length}\n`);
    changes.forEach(c => {
        console.log(` ${c.book.title.slice(0, 40).padEnd(40)} ${c.book.soldCount || 0} → ${c.next}`);
    });

    if (!apply) {
        console.log('\nDry run — re-run with --apply to write these values.');
    } else {
        for (const c of changes) {
            await Book.updateOne({ _id: c.book._id }, { $set: { soldCount: c.next } });
        }
        console.log(`\nUpdated ${changes.length} book(s).`);
    }

    await mongoose.disconnect();
};

run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
