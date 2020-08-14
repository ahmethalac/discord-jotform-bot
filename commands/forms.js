function waitForSubmissionCommand(message, formArray, jotform, Discord) {
  const filter = (m) => m.content.startsWith('submissions') && m.author === message.author;
  const collector = message.channel.createMessageCollector(filter, { time: 15000 });
  collector.on('collect', (collected) => {
    const formNumber = collected.content.trim().split(/ +/);
    formNumber.shift();
    if (formNumber.length !== 1) {
      message.channel.send('Wrong command! Structure of the command should be like "submissions formNumber"');
      // eslint-disable-next-line no-restricted-globals
    } else if (isNaN(Number(formNumber[0]))) {
      message.channel.send('Please enter integer for formNumber');
    } else if (Number(formNumber[0]) <= 0 || Number(formNumber[0]) > formArray.length) {
      message.channel.send(`Please enter a number between 1-${formArray.length}`);
    } else {
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
          jotform.getFormSubmissions(formArray[Number(formNumber[0]) - 1].id)
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
              message.channel.send(submissions);
            });
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
            waitForSubmissionCommand(message, formArray, jotform, Discord);
          });

        const informationMessage = new Discord.MessageEmbed()
          .setColor('#FFA500')
          .setAuthor('Jotform', 'https://www.jotform.com/resources/assets/logo/jotform-icon-white-560x560.jpg', 'https://www.jotform.com/')
          .setTitle('\nUse "submissions formNumber" command \nto get all submissions for a specific form')
          .setThumbnail('https://www.jotform.com/wepay/assets/img/podo.png?v=1.2.0.1');

        message.channel.send(informationMessage);
      });
  },
};
