const express = require('express');
const cors = require('cors');
const passport = require('passport');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/balances', require('./routes/balances'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/activity', require('./routes/activity'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
