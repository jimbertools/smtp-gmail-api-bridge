import express from "express";
import { sendMail } from "./google.js";
import { findUser } from "./users.js";
import { body, validationResult } from 'express-validator';
import * as fs from 'fs';
import https from "https";

const credentials =  {
    key: fs.readFileSync("/etc/letsencrypt/live/datastore.jimber.io/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/datastore.jimber.io/fullchain.pem"),
};

const app = express();

app.use(express.json());

app.post("/mail", 
    body('user').not().isEmpty(),
    body('password').not().isEmpty(),
    body('subject').not().isEmpty(),
    body('body').not().isEmpty(),
    body('to').isArray({min: 1}),
    body("to.*").isEmail(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const username = req.body.user;
        const password = req.body.password;

        const user = await findUser(username, password, ip);
        if (!user) {
            return res.status(401).json({ "status": "Unauthorized", "message": "Invalid credentials"});
        }

        const to = req.body.to;
        const body = req.body.body;
        const subject = req.body.subject;

        const messageObject = {
            envelope: {
                to: to,
                from: user.email
            },
            html: body,
            subject: subject,
        }
        
        const mail = await sendMail(user, messageObject);

        res.json(mail);
});

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(process.env.port || 8080);

