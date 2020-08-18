# discord-jotform-bot

Jotform Bot for Discord

## Getting Started

1. Go to .env file and edit the required parts for JotFormBot to work
2. Run `node src/main.js` in project folder

### Commands

- **!forms:** All forms can be listed by this command

    After listing the forms by !forms, below commands can be called with formNumber obtained from the list
    - **apply 'formNumber':** This command can be called to fill the specified form
    - **details 'formNumber':** This command can be called to get details of the specified form
    - **submissions 'formNumber':** This command can be called to get all submissions of the specified form

### TODO

    + Use exact versions in package.json (no ^)
    - Add subtle comments in your code
    + Add a dummy .env file
    - Add error handling in the post/submission route and return correct error codes
    - import `commands` via an index.js file and use its keys to iterate over and set commands
    - Remove `eslint disable` lines
    - use `import` instead of `require` (modern syntax)
    + set node version in package.json and also with a .nvmrc file and
    + update folder structure and move code under /src dir
    - use async/await in `execute` function under forms.js command file
    + rename index.js to main.js or server.js
    - for a more readable code, order of ops under {server|main}.js should follow like this:
        - set globals (eg. `const app = express();`)
        - set configs
        - run crucial ops
        - set routes
