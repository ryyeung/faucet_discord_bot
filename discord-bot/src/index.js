require('dotenv').config()
const {Client, IntentsBitField } = require('discord.js')

//intents are set of permissions bot can use 
//guild is a server
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

//listens when bot is ready
client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`)
} );

//event listener
client.on('messageCreate', (message)=>{

    //check if person is bot, if yes do nothing
    if(message.author.bot) {
        return;
    }


    if(message.content === 'hello'){
        message.reply('Hey!')
    }
});

//listen to interactions/event listener
client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return; 
  
    if (interaction.commandName === 'hey') {
      return interaction.reply('hey!');
    }
  
    if (interaction.commandName === 'ping') {
      return interaction.reply('Pong!');
    }
  });
  

client.login(
    process.env.TOKEN
);
