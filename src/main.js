import jotform from 'jotform';
import Discord from 'discord.js';
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import commands from './commands/index.js';

const bot = new Discord.Client();
const app = express();
const upload = multer();

dotenv.config();
jotform.options({
  debug: true,
  apiKey: process.env.JOTFORM_API_KEY,
  timeout: 120000,
});

let notificationChannel;

bot.login(process.env.DISCORD_TOKEN)
  .then(() => {
    bot.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID)
      .then((channel) => {
        notificationChannel = channel;
      });
  });

bot.on('message', (message) => {
  if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

  // Get command and args. For "!forms 1 2 3", command = forms and args = [1,2,3]
  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    commands[command](message, args, jotform, Discord, notificationChannel);
  } catch (e) {
    message.channel.send(`:x:  ${command} is not a valid command!`);
    console.error(e);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening port ${process.env.PORT || 3000}`);
});

app.post('/submission', upload.none(), (req, res) => {
  try {
    notificationChannel.send(new Discord.MessageEmbed()
      .setColor('#FFA500')
      .setAuthor(`New submission for "${req.body.formTitle}"`,
        'https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1')
      .setThumbnail('https://i.ibb.co/tpM3nkR/mail.png')
      .setDescription(String(req.body.pretty)
        .split(', ')
        .join('\n')));

    res.status(200).send('Successful');
  } catch (error) {
    res.status(400).send(error.message);
  }
});
