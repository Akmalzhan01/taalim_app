require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const expenditureRoutes = require('./routes/expenditureRoutes');
const reportRoutes = require('./routes/reportRoutes');
const taskRoutes = require('./routes/taskRoutes');
const kanbanColumnRoutes = require('./routes/kanbanColumnRoutes');
const supplyRoutes = require('./routes/supplyRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(express.json());

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://taalim-app-1.onrender.com',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        // Allow any onrender.com subdomain
        if (/^https:\/\/[\w-]+\.onrender\.com$/.test(origin)) return callback(null, true);
        // Allow explicitly listed origins
        if (allowedOrigins.includes(origin)) return callback(null, true);

        return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle OPTIONS preflight for all routes
app.options(/.*/, cors());

// Connect to Database
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/social-links', require('./routes/socialLinkRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/kanban-columns', kanbanColumnRoutes);
app.use('/api/supplies', supplyRoutes);
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vendors', vendorRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Keep-alive: prevent Render free tier from sleeping (ping every 14 min)
    if (process.env.NODE_ENV === 'production') {
        const https = require('https');
        const selfUrl = process.env.SELF_URL || 'https://taalim-app.onrender.com';
        setInterval(() => {
            https.get(selfUrl, (res) => {
                console.log(`Keep-alive ping: ${res.statusCode}`);
            }).on('error', (err) => {
                console.log(`Keep-alive error: ${err.message}`);
            });
        }, 14 * 60 * 1000); // 14 minutes
    }
});
