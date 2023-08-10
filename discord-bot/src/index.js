require("dotenv").config()
const { ethers, JsonRpcProvider } = require('ethers');
const {Client, IntentsBitField, Collection} = require('discord.js');



let contractAddress = process.env.CONTRACT_ADDRESS

let contractAbi = [
  {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [{ "name": "", "type": "address" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "token",
      "outputs": [{ "name": "", "type": "address" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "withdrawalAmount",
      "outputs": [{ "name": "", "type": "uint256" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "lockTime",
      "outputs": [{ "name": "", "type": "uint256" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [{ "name": "tokenAddress", "type": "address" }],
      "payable": true,
      "stateMutability": "payable",
      "type": "constructor"
  },
  {
      "constant": false,
      "inputs": [{ "name": "recipient", "type": "address" }],
      "name": "requestTokens",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [],
      "name": "",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "getBalance",
      "outputs": [{ "name": "", "type": "uint256" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [{ "name": "amount", "type": "uint256" }],
      "name": "setWithdrawalAmount",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [{ "name": "amount", "type": "uint256" }],
      "name": "setLockTime",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "anonymous": false,
      "inputs": [
          { "indexed": true, "name": "to", "type": "address" },
          { "indexed": false, "name": "amount", "type": "uint256" }
      ],
      "name": "Withdrawal",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          { "indexed": true, "name": "from", "type": "address" },
          { "indexed": false, "name": "amount", "type": "uint256" }
      ],
      "name": "Deposit",
      "type": "event"
  }
];

const INFURA_GOERLI_ENDPOINT = process.env.INFURA_GOERLI_ENDPOINT
const PRIVATE_KEY = process.env.PRIVATE_KEY


//async function
const provider = new ethers.providers.JsonRpcProvider(INFURA_GOERLI_ENDPOINT);
console.log({ provider });
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
console.log({ signer });
const contract = new ethers.Contract(contractAddress, contractAbi, signer); //signer = our acct that calls
console.log({ contract });

async function drip(address) {
    const tx = await contract.requestTokens(address);
    await tx.wait();
    console.log("success");
    return tx;
}


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
// client.on('messageCreate', (message)=>{

//     //check if person is bot, if yes do nothing
//     if(message.author.bot) {
//         return;
//     }
// });




//listen to interactions/event listener
client.on('interactionCreate', async (interaction) => {

    //keys: command names, values: userID & last time user used command
    client.cooldowns = new Collection();

    //set cooldown collection
    const { cooldowns } = client;
    const userID = interaction.user.id;
    const member = interaction.member;
    const commandName = interaction.commandName;

    if (!interaction.isChatInputCommand()) return; //check if chatInput command

    try{
        if(interaction.commandName === 'request_tokens') {
            
            await interaction.deferReply(); //allows longer 3-second response
            const address = interaction.options.get('address').value;
            const tx = await drip(address);
            const hash = tx.hash;
           
            //ephermal, msg only available to user who initiated interaction
            
            await interaction.followUp("The transaction hash is: " + hash + "\n\nTokens transferred!");

            //add to collections 
            if (!cooldowns.has(commandName)) {
                cooldowns.set(commandName, new Collection());
            }

            if (member.roles.cache.some(role => role.name === 'Admin')) {
                console.log("check")
                //check if cooldown set for command, not needed 
               // if (cooldowns.has(command.data.name)) {
                    const now = Date.now();
                    const timestamps = cooldowns.get(commandName);
                    const defaultCooldownDuration = 50; //one hr
                    const cooldownAmount = (commandName.cooldown ?? defaultCooldownDuration) * 1000; //convert to ms
        
                    //check if user_id is in collection
                    if (timestamps.has(interaction.user.id)) {
                        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        
                        if (now < expirationTime) {
                            const expiredTimestamp = Math.round(expirationTime / 1000);
                            return interaction.followUp({ content: `Insufficient time elapsed since last withdrawal \`${commandName}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
                        }
                    }
                    // Reset a cooldown
                    // timestamps.set(interaction.user.id, now);
                    // setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
               // }
            }
            
        }
    } catch(error){

        let errorMessage = error.message;
        
        if (error.error.reason.split('reverted: ')[1] == "Insufficient balance in faucet for withdrawal request") {
            errorMessage = "Insufficient balance in faucet for withdrawal request";
            interaction.followUp(`${errorMessage}, try again later.`);
        }
        else if (error.error.reason.split('reverted: ')[1] == "Insufficient time elapsed since last withdrawal - try again later.") {
            errorMessage = "Insufficient time elapsed since last withdrawal";
            interaction.followUp(`${errorMessage}, try again later.`);
        }
        else {
            interaction.followUp(`try again later.`);
        }
    }
        
        //check if 
        

        
        //check if not admin or staff -> apply cooldown
        //const member = interaction.options.getMember(string(userID)); 
        // if (member.roles.cache.some(role => role.name !== 'staff') 
        // || member.roles.cache.some(role => role.name !== 'admin')) {
            
        //for now, if admin -> apply cooldown
       


        //if success & first time request token, add dev role
        // const role = interaction.options.getRole('role');
        // const member = interaction.options.getMember('target');
        // member.roles.add(role);
    
  } );
  

client.login(
    process.env.TOKEN
);


// @commands.cooldown(1, 3600, commands.BucketType.user)
// async def command(ctx):
//     await ctx.send("command output")