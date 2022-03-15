import { SMTPServer } from "smtp-server"
import { sendMail } from "./google.js"
import { getUsers, setUsers } from "./users.js";
import * as bcrypt from "bcrypt";
import ipRangeCheck from "ip-range-check";

const server = new SMTPServer({
    secure: false,
    // key: fs.readFileSync("private.key"),
    // cert: fs.readFileSync("server.crt")

    onAuth(auth, session, callback) {
        const username = auth.username;
        const password = auth.password;
        const ip = session.remoteAddress;

        const users = getUsers();
        const user = users.find(user => user.login === username && bcrypt.compareSync(password, user.password) && ipRangeCheck(ip, user.ip));

        if (!user) {
          return callback(new Error("Invalid credentials"));
        }

        return callback(null, { user: user });
    },

    onData(stream, session, callback) {
        let parts = [];
        let buffer;
    
        stream.on("data", data => {
            parts.push(data);
        });

        stream.on("end", async () => {
            buffer = Buffer.concat(parts);
            const message = Buffer.from(buffer, 'base64').toString().trim();
            let splittedMessage = message.split("\r\n");

            splittedMessage = splittedMessage.map(m => {
              const index = m.indexOf(':');
              let values = [m.slice(0, index), m.slice(index + 1)];
              return [values[0].trim().toLowerCase(), values[1].trim()];
            });

            splittedMessage[splittedMessage.length - 1][0] = splittedMessage[0][1].includes("html") ? "html" : "text";
            const messageObject = constructObject(splittedMessage);

            await sendMail(session.user, messageObject);

            return callback();
        });
    }

});

const constructObject = arr => {
  return arr.reduce((acc, val) => {
     const [key, value] = val;
     acc[key] = value;
     return acc;
  }, {});
};

const run = async () => {
  await setUsers();
  server.listen(1025);

  setInterval(async () => {
      // Refresh users every 15 minutes
      await setUsers();
  }, 15 * 60 * 1000);
}

run();


//express
import express from 'express';

const app = express();

app.get("/callback", (req, res) => {
    return res.end(req.query.code);
});

app.listen("80");