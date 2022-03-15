import fs from "fs/promises";
import * as reader from "readline-sync";
import {google} from "googleapis";
import * as nodemailer from "nodemailer";
import { saveUser, setUsers } from "./users.js";

const SCOPES = ['https://mail.google.com/', 'email'];

const sendMail = async (user, message) => {
    const config = await fs.readFile("../config.json");
    const credentials = JSON.parse(config);
    const oAuth2Client = await authorize(credentials, user);

    const transporter = createTransporter(user.email, oAuth2Client._clientId, oAuth2Client._clientSecret, oAuth2Client.credentials.access_token, oAuth2Client.credentials.refresh_token);
    try {
        await transporter.sendMail({
          ...message,
          "from": userInfo.email
        });
    } catch (e) {
        // invalid accessToken ==> refresh it
        const token = (await oAuth2Client.refreshToken(oAuth2Client.credentials.refresh_token)).tokens;
        user.token = {
            ...token,
            refresh_token: user.token.refresh_token
        }
        await saveUser(user);
        authorize(credentials, user);
    }
    
}

const createTransporter = (email, clientId, clientSecret, accessToken, refreshToken) => {
  return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: email,
        accessToken,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken
    }
  });
}

const authorize = async (credentials, user) => {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!user.token) {
      const token = await getNewToken(user, oAuth2Client);
      user.token = token;
      await saveUser(user);
  }
  
  oAuth2Client.setCredentials(user.token);
  return oAuth2Client;
}

const getNewToken = async (user, oAuth2Client) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  console.log('Authorize this app by visiting this url:', authUrl);

  const code = reader.question("Enter the code from that page here: ");
  try {
      const token = await oAuth2Client.getToken(code);
      return token.tokens;
  } catch (e) {
    throw new Error("Invalid code, try again.");
    
  }
}

export {
  authorize,
  sendMail,
  getNewToken
}