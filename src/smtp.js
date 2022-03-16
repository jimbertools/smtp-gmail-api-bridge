import { SMTPServer } from "smtp-server"
import { sendMail } from "./google.js"
import { getUsers, setUsers } from "./users.js";
import * as bcrypt from "bcrypt";
import ipRangeCheck from "ip-range-check";
import * as fs from 'fs';

const server = new SMTPServer({
    key: fs.readFileSync("/etc/letsencrypt/live/datastore.jimber.io/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/datastore.jimber.io/fullchain.pem"),

    onAuth(auth, session, callback) {
        const username = auth.username;
        const password = auth.password;
        const ip = session.remoteAddress;

        const users = getUsers();
        const user = users.find(u => u.login === username && bcrypt.compareSync(password, u.password) && ipRangeCheck(ip, u.ip));

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
            const messageObject = {
              envelope: {
                  to: session.envelope.rcptTo,
                  from: session.user.email
              },
              raw: message,
            }

            await sendMail(session.user, messageObject);

            return callback();
        });
    }

});


const run = async () => {
  await setUsers();
  server.listen(1025);

  setInterval(async () => {
      // Refresh users every 15 minutes
      await setUsers();
  }, 15 * 60 * 1000);
}

run();
