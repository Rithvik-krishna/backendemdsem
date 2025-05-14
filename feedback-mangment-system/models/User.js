const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');

const dataDir = path.dirname(usersFile);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
}

const readUsers = () => {
    try {
        const data = fs.readFileSync(usersFile, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

class User {
    constructor(username, password, feedbacks = []) {
        this.username = username;
        this.password = password;
        this.feedbacks = feedbacks;
    }

    static async create(username, password) {
        const users = readUsers();
        const hash = await bcrypt.hash(password, 10);
        const newUser = new User(username, hash);
        users.push(newUser);
        writeUsers(users);
        return newUser;
    }

    static find(username) {
        const users = readUsers();
        return users.find(user => user.username === username);
    }

    static updateFeedback(username, feedback) {
        const users = readUsers();
        const user = users.find(u => u.username === username);
        if (!user) return false;

        user.feedbacks.push(feedback);
        writeUsers(users);
        return true;
    }

    static getFeedbacks(username) {
        const user = this.find(username);
        return user ? user.feedbacks : null;
    }

    static async comparePassword(username, password) {
        const user = this.find(username);
        if (!user) return false;
        return await bcrypt.compare(password, user.password);
    }
}

module.exports = User;
