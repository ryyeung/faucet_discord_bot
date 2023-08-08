require("dotenv").config()
const { ethers, JsonRpcProvider } = require('ethers');
const {Client, IntentsBitField } = require('discord.js');

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

const API_URL = process.env.API_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY


//async function
const provider = new ethers.providers.JsonRpcProvider(API_URL);
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
    if (!interaction.isChatInputCommand()) return; //check if chatInput command

    try{
        if(interaction.commandName === 'request_tokens_guild_specific') {
            
            await interaction.deferReply(); //allows longer 3-second response
            const address = interaction.options.get('address').value;
            const tx = await drip(address);
            const hash = tx.hash;
           
            //ephermal, msg only available to user who initiated interaction
            
            await interaction.followUp("The transaction hash is: " + hash + "\n\nTokens transferred!");


            //return interaction.reply("The transaction hash is: " + hash);
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
  } );
  

client.login(
    process.env.TOKEN
);
