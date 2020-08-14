function waitForCommand(message, formArray, jotform, Discord) {
  const filter = (m) => m.author === message.author;
  const collector = message.channel.createMessageCollector(filter, { time: 15000 });

  function getSubmissions(formID, questionNames) {
    jotform.getFormSubmissions(formID)
      .then((r) => {
        const submissions = new Discord.MessageEmbed()
          .setColor('#FFA500')
          .setTitle('Submissions:')
          .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
          .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1')
          .addFields(
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

  function apply(formID, questionNames) {
    const submission = new Map();

    const informationMessage = new Discord.MessageEmbed()
      .setColor('#FFA500')
      .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
      .setTitle('Welcome to the form filler :cat:\n\nPlease answer every question I will ask one by one'
        + '\n\nAfter filling all fields, your submission will be sent automatically')
      .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1');

    message.channel.send(informationMessage);

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
              })
              .finally(() => {
                askQuestionRecursive(index + 1);
              }),
          );
      } else {
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

  collector.on('collect', (collected) => {
    const formNumber = collected.content.trim().split(/ +/);
    const command = formNumber.shift();
    if (formNumber.length !== 1) {
      message.channel.send('Wrong command! Structure of the command should be like "submissions formNumber"');
      // eslint-disable-next-line no-restricted-globals
    } else if (isNaN(Number(formNumber[0]))) {
      message.channel.send('Please enter integer for formNumber');
    } else if (Number(formNumber[0]) <= 0 || Number(formNumber[0]) > formArray.length) {
      message.channel.send(`Please enter a number between 1-${formArray.length}`);
    } else if (command === 'submissions' || command === 'apply') {
      collector.stop();
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
          if (command === 'submissions') {
            getSubmissions(formArray[Number(formNumber[0]) - 1].id, questionNames);
          } else if (command === 'apply') {
            apply(formArray[Number(formNumber[0]) - 1].id, questionNames);
          }
        });
    }
  });
}

module.exports = {
  name: 'forms',
  execute(message, args, jotform, Discord) {
    jotform.getForms({ limit: 50 })
      .then((value) => {
        const formArray = [];

        value.forEach((element) => {
          if (element.status === 'ENABLED') {
            formArray.push(element);
          }
        });

        const replyMessage = new Discord.MessageEmbed()
          .setColor('#FFA500')
          .setTitle('Forms:')
          .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
          .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1')
          .addFields(
            ...formArray.map((element, index) => ({
              name: `${index + 1}-) ${element.title}`,
              value: `created at: ${element.created_at}\nlast modified at: ${element.updated_at}\n${element.count} total submissions\nurl: ${element.url}`,
            })),
          );

        message.channel.send(replyMessage)
          .then(() => {
            waitForCommand(message, formArray, jotform, Discord);
          });

        const informationMessage = new Discord.MessageEmbed()
          .setColor('#FFA500')
          .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
          .setTitle('\nUse "submissions formNumber" command \nto get all submissions of a specific form'
            + '\n\nUse "apply formNumber" command to fill\nthe specified form"')
          .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1');

        message.channel.send(informationMessage);
      });
  },
};
