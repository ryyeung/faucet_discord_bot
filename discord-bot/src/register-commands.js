
require('dotenv').config();
const{REST,Routes} = require('discord.js');

const commands = [
    {
      name: 'hey',
      description: 'Replies with hey!',
    },
    {
      name: 'ping',
      description: 'Pong!',
    },
  ];

//interact with API 
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => { //allows await() to check for errors
  try {
    console.log('Registering slash commands...');

    await rest.put( //send Put request to update info
      Routes.applicationGuildCommands( //generate URL
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands } //object payload of put request
    );

    console.log('Slash commands were registered successfully!');
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();