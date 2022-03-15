import fs from "fs/promises";
import { v4 as uuidv4 } from 'uuid';
import { getNewToken } from "./google.js";
import {google} from "googleapis";
import * as bcrypt from "bcrypt";

let users;

const getUsers = () => {
    return users;
}

const setUsers = async (newUsers) => {
    users = newUsers ? newUsers : JSON.parse(await fs.readFile("../users.json"));
}

const createUser = async (login, password, ip) => {
    password = bcrypt.hashSync(password, 10);
    const user = { id: uuidv4(), login, password, ip };
    
    await setUsers();
    if (users.some(u => user.login === u.login)) {
        throw new Error("Login already exists");
    }

    const config = await fs.readFile("../config.json");
    const credentials = JSON.parse(config);
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const token = await getNewToken(user, oAuth2Client);
    user.token = token;

    oAuth2Client.setCredentials(token);
    const userInfo = JSON.parse(Buffer.from(oAuth2Client.credentials.id_token.split('.')[1], 'base64').toString());
    user.email = userInfo.email;

    await saveUser(user);
}

const saveUser = async (user) => {
    await setUsers();
    
    let tmpUsers = getUsers();
    if (!users.some(u => u.id === user.id)) {
        tmpUsers = [...tmpUsers, user];
    }

    tmpUsers = tmpUsers.map(u => {
        return u.id === user.id ? user : u;
    });

    await fs.writeFile("../users.json", JSON.stringify(tmpUsers));
    await setUsers(tmpUsers);
}

export {
    getUsers,
    setUsers,
    createUser,
    saveUser
}