const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Book = require('./models/Book');
const User = require('./models/User'); // Import User model if you intend to use it, or remove

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

const books = [
    {
        title: 'O\'tkan kunlar',
        author: 'Abdulla Qodiriy',
        description: 'Ota-ona va farzandlar munosabati, sevgi va sadoqat haqida o\'zbek adabiyotining durdona asari. Roman XIX asr o\'rtalaridagi Toshkent va Qo\'qon muhitini jonli tasvirlaydi.',
        price: 45000,
        summary: 'Otabek va Kumushbibi sevgisi, ularning taqdiri va fojeasi haqida hikoya qiluvchi tarixiy roman.',
        image: 'https://assets.asaxiy.uz/product/items/desktop/5e15bc9d63c5d.jpg',
        rating: 5,
        numReviews: 120,
        soldCount: 500,
    },
    {
        title: 'Shaytanat',
        author: 'Tohir Malik',
        description: 'Jinoyat olami va uning qurbonlari, adolat va qasos haqida o\'tkir syujetli asar. Asadbekning hayoti va uning atrofidagi voqealar kitobxonni o\'ziga rom etadi.',
        price: 55000,
        summary: 'Mashhur "Shaytanat" serialining badiiy asosi bo\'lgan ushbu kitobda mafiya olami sirlari ochib beriladi.',
        image: 'https://kitobxon.com/img_knigi/1779.jpg',
        rating: 4.8,
        numReviews: 95,
        soldCount: 350,
    },
    {
        title: 'Sariq devni minib',
        author: 'Xudoyberdi To\'xtaboyev',
        description: 'Bolalar va kattalar uchun ajoyib sarguzasht asari. Hoshimjonning sehrli qalpoqchasi va uning boshidan kechirgan qiziqarli voqealari.',
        price: 35000,
        summary: 'Sehrli qalpoqcha yordamida ko\'rinmas bo\'lib qolgan Hoshimjon dunyo bo\'ylab sayohat qiladi.',
        image: 'https://kitobxon.com/img_knigi/sariq_devni_minib.jpg.jpg',
        rating: 4.9,
        numReviews: 200,
        soldCount: 600,
    },
    {
        title: 'Ikki eshik orasida',
        author: 'O\'tkir Hoshimov',
        description: 'Urush yillari va undan keyingi davr mashaqqatlari, inson taqdiri va matonati haqida chuqur falsafiy asar.',
        price: 48000,
        summary: 'Oddiy o\'zbek oilasining hayoti misolida butun bir davr fojiasi va quvonchlari aks ettirilgan.',
        image: 'https://assets.asaxiy.uz/product/items/desktop/5e15bc6a29583.jpg',
        rating: 4.7,
        numReviews: 80,
        soldCount: 250,
    },
    {
        title: 'Yulduzli tunlar',
        author: 'Pirimqul Qodirov',
        description: 'Zahiriddin Muhammad Bobur hayoti, uning shoh va shoir sifatidagi faoliyati, Vatan sog\'inchi haqida tarixiy roman.',
        price: 52000,
        summary: 'Boburning bolaligidan to umrining oxirigacha bo\'lgan davrni qamrab oluvchi epik polotno.',
        image: 'https://kitobxon.com/img_knigi/357.jpg',
        rating: 4.9,
        numReviews: 150,
        soldCount: 400,
    },
    {
        title: 'Atomic Habits',
        author: 'James Clear',
        description: 'No matter your goals, Atomic Habits offers a proven framework for improving--every day.',
        price: 120000,
        summary: 'An easy & proven way to build good habits & break bad ones.',
        image: 'https://m.media-amazon.com/images/I/91bYsX41DVL.jpg',
        rating: 5,
        numReviews: 1000,
        soldCount: 5000,
    },
    {
        title: 'Rich Dad Poor Dad',
        author: 'Robert Kiyosaki',
        description: 'What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!',
        price: 90000,
        summary: 'The book explodes the myth that you need to earn a high income to be rich and explains the difference between working for money and having your money work for you.',
        image: 'https://m.media-amazon.com/images/I/81bsw6fnUiL.jpg',
        rating: 4.8,
        numReviews: 850,
        soldCount: 4500,
    },
    {
        title: 'Harry Potter and the Sorcerer\'s Stone',
        author: 'J.K. Rowling',
        description: 'Rescued from the outrageous neglect of his aunt and uncle, a young boy with a great destiny proves his worth while attending Hogwarts School for Witchcraft and Wizardry.',
        price: 110000,
        summary: 'Harry Potter has no idea how famous he is. That\'s because he\'s being raised by his miserable aunt and uncle who are terrified Harry will learn that he\'s really a wizard, just as his parents were.',
        image: 'https://m.media-amazon.com/images/I/71RVt3+7QZL._AC_UF1000,1000_QL80_.jpg',
        rating: 4.9,
        numReviews: 1500,
        soldCount: 8000,
    },
    {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        description: 'A special 25th anniversary edition of the extraordinary international bestseller, including a new Foreword by Paulo Coelho.',
        price: 85000,
        summary: 'Combining magic, mysticism, wisdom and wonder into an inspiring tale of self-discovery, The Alchemist has become a modern classic.',
        image: 'https://m.media-amazon.com/images/I/51Z0nLAfLmL.jpg',
        rating: 4.7,
        numReviews: 900,
        soldCount: 3000,
    },
    {
        title: 'Example With No Image',
        author: 'Test Author',
        description: 'This book has a placeholder image URL.',
        price: 20000,
        summary: 'Testing fallback icon.',
        image: 'https://via.placeholder.com/150', // valid URL to pass validation
        rating: 3.5,
        numReviews: 10,
        soldCount: 50,
    }
];

const importData = async () => {
    try {
        await Book.deleteMany();

        await Book.insertMany(books);

        console.log('Data Imported!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Book.deleteMany();

        console.log('Data Destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

connectDB().then(() => {
    if (process.argv[2] === '-d') {
        destroyData();
    } else {
        importData();
    }
});
