const Discord = require('discord.js');
const fs = require('fs');
const jotform = require('jotform');
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/submission', (req) => {
  console.log(req.body);
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening port ${process.env.PORT || 3000}`);
});

jotform.options({
  debug: true,
  apiKey: process.env.JOTFORM_API_KEY,
  timeout: 120000,
});

const bot = new Discord.Client();
bot.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

// eslint-disable-next-line no-restricted-syntax
for (const file of commandFiles) {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const command = require(`./commands/${file}`);
  bot.commands.set(command.name, command);
}

bot.on('message', (message) => {
  if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  /**
   * TODO:
   *  - Keep `command` and command file names same, so we can directly call commands
   *  - You might want to wrap the function body in a try/catch and return error on catch
   */
  try {
    bot.commands.get(command).execute(message, args, jotform, Discord);
  } catch (e) {
    message.channel.send(`:x:  ${command} is not a valid command!`);
    console.error(e);
  }
});

bot.once('ready', () => {
  console.log('Ready!');
});

bot.login(process.env.DISCORD_TOKEN);
