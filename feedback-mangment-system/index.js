const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('./models/User');
const Authenticate = require('./isAuth');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const validateUsernamePassword = (username, password) => {
    if (!username || !password) return false;
    if (typeof username !== 'string' || typeof password !== 'string') return false;
    return username.trim().length > 0 && password.trim().length > 0;
};

app.post('/', async (req, res) => {
    const { username, password } = req.body;
    if (!validateUsernamePassword(username, password)) {
        return res.status(400).json({ message: 'Invalid input format.' });
    }

    const existing = User.find(username);
    if (existing) {
        return res.status(409).json({ message: 'Username already exists.' });
    }

    const newUser = await User.create(username, password);
    res.cookie('username', username);
    return res.status(200).json({ message: 'User created successfully.', user: { username: newUser.username } });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!validateUsernamePassword(username, password)) {
        return res.status(400).json({ message: 'Invalid input format.' });
    }

    const user = User.find(username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await User.comparePassword(username, password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { maxAge: 3600000 });
    return res.status(200).json({ message: `Welcome, ${username}!` });
});

app.post('/add-feedback', Authenticate, (req, res) => {
    const { service_name, feedback_text } = req.body;
    if (!service_name || !feedback_text || typeof service_name !== 'string' || typeof feedback_text !== 'string') {
        return res.status(400).json({ message: 'Invalid feedback data' });
    }

    const feedback = { service_name, feedback_text, timestamp: new Date() };
    const success = User.updateFeedback(req.username, feedback);

    if (!success) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ message: 'Feedback submitted successfully!' });
});

app.get('/feedback', Authenticate, (req, res) => {
    const feedbacks = User.getFeedbacks(req.username);
    if (!feedbacks) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ feedbacks });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
