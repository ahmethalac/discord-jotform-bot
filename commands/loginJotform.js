module.exports = {
  name: 'loginJotform',
  description: 'Login',
  execute(message, args, jotform) {
    jotform.getUser()
      .then((response) => {
        console.log(response);
      });
    console.log(`Username: ${args[0]}`);
    console.log(`Password: ${args[1]}`);
  },
};
