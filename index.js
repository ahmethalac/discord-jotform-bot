const Discord = require('discord.js');
const fs = require('fs');
const jotform = require('jotform');
const { prefix, token, jotformKey } = require('./config.json');

jotform.options({
  debug: true,
  apiKey: jotformKey,
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
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'forms') {
    bot.commands.get('getForms').execute(message, args, jotform, Discord, prefix);
  }
  // other commands...
});

bot.once('ready', () => {
  console.log('Ready!');
});

bot.login(token);
