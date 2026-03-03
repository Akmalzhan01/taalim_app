require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const KanbanColumn = require('./models/KanbanColumn');
        const cols = await KanbanColumn.find({});
        console.log(`Total columns in DB: ${cols.length}`);
        console.log(JSON.stringify(cols.slice(0, 3), null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
