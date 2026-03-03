const axios = require('axios');

const sendOrderNotification = async (order) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.log('Telegram credentials missing, skipping notification.');
        return;
    }

    // Format Message
    const itemsList = order.items.map(item =>
        `- ${item.title} x${item.qty} (${item.price.toLocaleString()} сом)`
    ).join('\n');

    const total = order.totalPrice.toLocaleString();
    const address = order.shippingAddress.address;
    const phone = order.shippingAddress.city; // Phone is stored in city temporarily
    const payment = order.paymentMethod === 'Online' ? '💳 Online / MBank' : '💵 Naqd';
    const comment = order.comment ? `\n💬 Izoh: ${order.comment}` : '';

    const message = `
📦 **Yangi Buyurtma!**

👤 **Mijoz:** ${phone}
📍 **Manzil:** ${address}

📚 **Kitoblar:**
${itemsList}

💰 **Jami:** ${total} сом
💳 **To'lov:** ${payment}${comment}

📅 ${new Date(order.createdAt).toLocaleString()}
    `;

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('Telegram notification sent');
    } catch (error) {
        console.error('Error sending Telegram message:', error.message);
    }
};

const sendMessageToAdmin = async (message) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.log('Telegram credentials missing, skipping admin message.');
        return;
    }

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('Admin notification sent');
    } catch (error) {
        console.error('Error sending Admin Telegram message:', error.message);
    }
};

module.exports = { sendOrderNotification, sendMessageToAdmin };
