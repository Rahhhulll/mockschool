const express = require('express');
const connectDB = require('./config/db');

const app = express();

const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'MockSchool API is running'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});