# discord-jotform-bot

Jotform Bot for Discord

## Getting Started

1. Clone the project
2. Go to .env file and edit the required parts for JotFormBot to work
3. Run `node src/main.js` in project folder

### Commands

- **!forms:** All forms can be listed by this command

    After listing the forms by !forms, below commands can be called with formNumber obtained from the list
    - **fill 'formNumber':** This command can be called to fill the specified form
    - **details 'formNumber':** This command can be called to get details of the specified form
    - **submissions 'formNumber':** This command can be called to get all submissions of the specified form
    
## Jotform Webhook Setup

If you want to get notifications on a Discord text channel on new submissions to your form
you must


1. Add ID of a Discord channel to .env file.  
Visit
https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID- to learn how to get it
2. Run `node src/main.js` on a server
3. Add `YOUR_SERVER_URL/submission` webhook to a Jotform Form
4. Enjoy getting new submissions on Discord

