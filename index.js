const Discord = require('discord.js');
const fs = require('fs');
const jotform = require('jotform');
const express = require('express');
const multer = require('multer');
require('dotenv').config();

jotform.options({
  debug: true,
  apiKey: process.env.JOTFORM_API_KEY,
  timeout: 120000,
});

const bot = new Discord.Client();
let notificationChannel;

bot.login(process.env.DISCORD_TOKEN)
  .then(() => {
    bot.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID)
      .then((channel) => {
        notificationChannel = channel;
      });
  });

bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

const app = express();
const upload = multer();

app.post('/submission', upload.none(), (req, res) => {
  notificationChannel.send(new Discord.MessageEmbed()
    .setColor('#FFA500')
    .setAuthor(`New submission for "${req.body.formTitle}"`, 'https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1')
    .setThumbnail('https://i.ibb.co/tpM3nkR/mail.png')
    .setDescription(String(req.body.pretty).split(', ').join('\n')));
  res.send();
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening port ${process.env.PORT || 3000}`);
});

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

  try {
    bot.commands.get(command).execute(message, args, jotform, Discord);
  } catch (e) {
    message.channel.send(`:x:  ${command} is not a valid command!`);
    console.error(e);
  }
});
