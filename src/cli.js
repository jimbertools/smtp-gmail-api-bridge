import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { createUser } from "./users.js";

yargs(hideBin(process.argv))
  .command('add-user', 'Adds a user and saves the tokens of OAuth2', async (argv) => {
      const { login, password, ip } = argv.argv;
      await createUser(login, password, ip);
  })
  .option('login', {
    alias: 'l',
    description: 'Login name',
    type: 'string',
  })
  .option('password', {
      alias: 'p',
      description: 'User password',
      type: 'string'
  })
  .options('ip', {
    alias: 'i',
    description: 'The IP a user is allowed to send mails from',
    type: 'string'
  })
  .demandOption(["login", "password", "ip"])
  .help()
  .alias('help', 'h').argv;
