require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
app.use(bodyParser.json());
app.use(helmet());

const rateLimiter = new RateLimiterMemory({
    points: 10,
    duration: 1,
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

app.post('/location', (req, res) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            const { latitude, longitude } = req.body;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: process.env.EMAIL_ADDRESS,
                subject: 'Location Data',
                text: `Latitude: ${latitude}, Longitude: ${longitude}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.status(500).send('Error sending email.');
                } else {
                    console.log('Email sent: ' + info.response);
                    res.status(200).send({ message: 'Location received and email sent.' });
                }
            });
        })
        .catch(() => {
            res.status(429).send('Too Many Requests');
        });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
