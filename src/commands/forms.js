function waitForCommand(message, formArray, jotform, Discord, notificationChannel) {
  // Get all messages from author of the "!forms" message
  const filter = (m) => m.author === message.author;
  const collector = message.channel.createMessageCollector(filter, { time: 600000 });

  function getSubmissions(formID, questionNames) {
    jotform.getFormSubmissions(formID)
      .then((r) => {
        const submissions = new Discord.MessageEmbed()
          .setColor('#FFA500')
          .setTitle('Submissions:')
          .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
          .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1')
          .addFields( // Iterate over submissions and add a new field for each of them
            ...r.map((submission, index) => ({
              name: `${index + 1}.`,
              value: Array.from(questionNames.keys())
                .map((qid) => {
                  if (submission.answers[qid].prettyFormat !== undefined) {
                    return `${questionNames.get(qid)}: ${submission.answers[qid].prettyFormat}`;
                  }
                  return `${questionNames.get(qid)}: ${submission.answers[qid].answer}`;
                }).join('\n'),
            })),
          );
        if (Array.from(r).length === 0) {
          submissions.addField('\u200b', 'There is no submissions for this form!');
        }
        message.channel.send(submissions);
      });
  }

  function apply(formID, formTitle, questionNames) {
    const informationMessage = new Discord.MessageEmbed()
      .setColor('#FFA500')
      .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
      .setTitle('Welcome to the form filler :cat:\n\nPlease answer every question I will ask one by one'
        + '\n\nAfter filling all fields, your submission will be sent automatically')
      .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1');

    message.channel.send(informationMessage);

    const fieldsWithAnswers = [];
    const submission = new Map();

    function askQuestionRecursive(index) {
      if (index !== questionNames.size) {
        const key = Array.from(questionNames.keys())[index];
        message.channel
          .send(new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle(`${questionNames.get(key)} ?`))
          .then(
            message.channel.awaitMessages((m) => m.author === message.author, { max: 1, time: 30000, errors: ['time'] })
              .then((collected) => {
                submission.set(`submission[${key}]`, collected.first().content);
                fieldsWithAnswers.push(`${questionNames.get(key)}: ${collected.first().content}`);
              })
              .finally(() => {
                askQuestionRecursive(index + 1);
              }),
          );
      } else {
        notificationChannel.send(new Discord.MessageEmbed()
          .setColor('#FFA500')
          .setAuthor(`New submission for "${formTitle}"`, 'https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1')
          .setThumbnail('https://i.ibb.co/tpM3nkR/mail.png')
          .setDescription(fieldsWithAnswers.join('\n')));

        jotform.createFormSubmission(formID, Object.fromEntries(submission))
          .finally(() => {
            message.channel
              .send(new Discord.MessageEmbed()
                .setColor('#529C29')
                .setTitle('Thank You!')
                .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
                .setDescription('Your submission has been received!')
                .setThumbnail('https://cdn.jotfor.ms/img/check-icon.png'));
          });
      }
    }

    askQuestionRecursive(0);
  }

  function getDetails(formDetails) {
    message.channel
      .send(new Discord.MessageEmbed()
        .setColor('#FFA500')
        .setTitle(formDetails.title)
        .setThumbnail('https://i.ibb.co/P1VTF14/info.png')
        .addFields([
          { name: 'Creation Date:', value: formDetails.created_at },
          { name: 'Last Modified Date:', value: formDetails.updated_at },
          { name: 'Last Submission Date:', value: formDetails.last_submission },
          { name: 'Unread submissions:', value: formDetails.new },
          { name: 'Total submissions:', value: formDetails.count },
          { name: 'Form Type:', value: formDetails.type },
          { name: 'URL:', value: formDetails.url },
        ]));
  }

  collector.on('collect', (collected) => {
    if (collected.content === '!forms') {
      collector.stop();
      return;
    }
    const formNumber = collected.content.trim().split(/ +/);
    const command = formNumber.shift();
    if (formNumber.length !== 1) {
      message.channel.send('Wrong command! Structure of the command should be like "submissions formNumber"');
    } else if (Number.isInteger(formNumber[0])) {
      message.channel.send('Please enter integer for formNumber');
    } else if (Number(formNumber[0]) <= 0 || Number(formNumber[0]) > formArray.length) {
      message.channel.send(`Please enter a number between 1-${formArray.length}`);
    } else if (command === 'submissions' || command === 'fill' || command === 'details') {
      const questionNames = new Map();
      jotform.getFormQuestions(formArray[Number(formNumber[0]) - 1].id)
        .then((response) => {
          Object.keys(response).forEach((key) => {
            if (response[key].hidden !== 'Yes' && response[key].type !== 'control_button') {
              questionNames.set(key, response[key].text);
            }
          });
        })
        .then(() => {
          collector.stop();
          const form = formArray[Number(formNumber[0]) - 1];
          if (command === 'submissions') {
            getSubmissions(form.id, questionNames);
          } else if (command === 'fill') {
            apply(form.id, form.title, questionNames);
          } else if (command === 'details') {
            getDetails(form);
          }
        });
    }
  });
}

export default async (message, args, jotform, Discord, notificationChannel) => {
  const forms = await jotform.getForms({ limit: 50 });
  const formArray = [];

  forms.forEach((form) => {
    if (form.status === 'ENABLED' && !form.title.startsWith('todoList_')) {
      formArray.push(form);
    }
  });

  const replyMessage = new Discord.MessageEmbed()
    .setColor('#FFA500')
    .setTitle('Forms:')
    .setAuthor(
      'Jotform',
      'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg',
      'https://www.jotform.com/',
    )
    .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1')
    .addFields(
      ...formArray.map((element, index) => ({
        name: `${index + 1}-) ${element.title}`,
        value: `${element.count} total submissions`,
      })),
    );

  await message.channel.send(replyMessage);
  waitForCommand(message, formArray, jotform, Discord, notificationChannel);

  const informationMessage = new Discord.MessageEmbed()
    .setColor('#FFA500')
    .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
    .setTitle('\nUse "submissions formNumber" command \nto get all submissions of the specified form'
            + '\n\nUse "fill formNumber" command to fill\nthe specified form'
            + '\n\nUse "details formNumber" command to get\n details of the specified form')
    .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1');

  await message.channel.send(informationMessage);
};
