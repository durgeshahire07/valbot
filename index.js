//INDEX
//TODO: RE-ORGANISE FOLDER STRUCTURE
const fs = require('fs'),
  path = require('path'),
  util = require('util')



/**
 * @typedef {Class} Message
 * @description Discord Message Class 
 * @global
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Message}
 */
const Discord = require('discord.js')
const {prefix, token} = require('./config.json')

const insults = require('./insults')
const BOT_COMMANDS = require('./commands')

//Contains all environment constants without the need for `process.env`.

//The values are empty by default to wait till the connection to the database and server has been established to avoid runtime errors

const __ENV = {
  __DATABASE_OBJECT: {},
  __AVAILABLE_ROLES: {},
  __WATCHED_MESSAGES: {},
  __VALARIUM_CLIENT: require('./client').__VALARIUM_CLIENT,
  __VALARIUM_GUILD: function(){return this.__VALARIUM_CLIENT.guilds.find(guild=>guild.name === 'VALARIUM')},
  __MEMBER_COUNT_CHANNEL: function(){return this.__VALARIUM_GUILD().channels.find(channel=>channel.id === '586768857113296897')},
  __MODERATION_NOTICES_CHANNEL: function(){return this.__VALARIUM_GUILD().channels.find(channel=> channel.id === '587571479173005312')},
  __TEST_CHANNEL: function(){return this.__VALARIUM_GUILD().channels.filter(channel=>channel.id === '571824874969104416')},
  __DISCORD_EXPLANATION: {},
  __WARNING_EXCEPTIONS: [
    '238009405176676352'
  ]
}

//Loading discordExplanation.md file
fs.readFile('discordExplanation.md', 'utf8', (err, data) => {
  if (err) throw err
  let fullMessage = data
  __ENV.__DISCORD_EXPLANATION.part1 = fullMessage.substr(0, fullMessage.indexOf('THIS IS THE BREAK!'))
  __ENV.__DISCORD_EXPLANATION.part2 = fullMessage.substr(fullMessage.indexOf('THIS IS THE BREAK!') + 'THIS IS THE BREAK!'.length)
})

async function updateMemberCount(){
  try{
    let memberCount = await __ENV.__VALARIUM_GUILD().memberCount
    console.log(`CURRENT MEMBER COUNT: ${memberCount}`)
    __ENV.__MEMBER_COUNT_CHANNEL().setName(`${memberCount}`)
  }
  catch(err){
    console.log(`Couldn't execute updateMemberCount\n${err}`)
    console.trace
  }
}


__ENV.__VALARIUM_CLIENT.once('ready', async () => {
  try{
    console.log('Ready!')
    __ENV.__DATABASE_OBJECT = await require('./dbconnect').getDB()
    __ENV.__AVAILABLE_ROLES = await __ENV.__DATABASE_OBJECT.collection('AVAILABLE_ROLES').find({}).project({_id:0}).toArray()
    __ENV.__WATCHED_MESSAGES = await __ENV.__DATABASE_OBJECT.collection('WATCHED_MESSAGES').find({}).toArray()
  
    await __ENV.__DATABASE_OBJECT.collection('GUILD_WARNINGS').deleteMany({})
    updateMemberCount()
    
    __ENV.__VALARIUM_GUILD().channels.forEach(channel=>{
      
    })
  }
  catch(err){
    console.log(`Couldn't execute __ENV.__VALARIUM_CLIENT.once(..) ${err}`)
    console.trace()
  }
})

/**
 * Checks whether a message is being watched for reactions
 * @function
 * @name checkWatchedMessage
 * @param {Message} message The message object to check
 * @return {Document} The watched message fetched from DB
 * @since 1.0.0
 */
function checkWatchedMessage(message){
  return __ENV.__WATCHED_MESSAGES.find(watched => watched.MESSAGE_ID === message.id)
}

__ENV.__VALARIUM_CLIENT.on('raw', async packet => {
  try{
    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return
    console.log(packet)
    const channel = __ENV.__VALARIUM_CLIENT.channels.get(packet.d.channel_id)

    //TODO: Add listener for cached messages to allow for better speed

    let message = await channel.fetchMessage(packet.d.message_id)
    let watchedMessage = checkWatchedMessage(message)

    if(watchedMessage != null && watchedMessage != undefined){
      let reactedMember = message.member
      let reaction = watchedMessage.WATCHED_REACTIONS.find(reaction => reaction.REACTION_NAME === packet.d.emoji.name)
      
      if(reaction != null && reaction != undefined){
        if(packet.t === 'MESSAGE_REACTION_ADD') reactedMember.addRole(reaction.REACTION_ROLE_ID)
        else if(packet.t === 'MESSAGE_REACTION_REMOVE') reactedMember.removeRole(reaction.REACTION_ROLE_ID)
      }
      else throw Error('REACTION OBJECT UNDEFINED/NULL')
    }
    else return

  }
  catch(err){
    console.log(`ERROR IN REACTION HANDLING\n${err}`)
  }
})

__ENV.__VALARIUM_CLIENT.login(token)


//NEW USERS HANDLING
__ENV.__VALARIUM_CLIENT.on('guildMemberAdd', async member=>{
  try{
    updateMemberCount()

    const Organisers = __ENV.__VALARIUM_GUILD().roles.find(role => role.name === "Organisers")
    const Contributors = __ENV.__VALARIUM_GUILD().roles.find(role => role.name === "Contributors")

    member.addRole('586951260259876875')
    
    let DMChannel = await member.createDM()
    await DMChannel.send(`Hey, ${member.displayName}, Welcome to Valarium :tada::hugging:! We are glad to have you with us! Please consider reading the <#571718462179770369> and getting yourself some <#586620199457914904> :wink: before heading to <#571721246362959919> to contribute to our great community!`)
    await DMChannel.send(`\`\`\`md\n${discordExplanationMessage.part1}\`\`\``)
    DMChannel.send(`\`\`\`md\n${discordExplanationMessage.part2}\`\`\``)
    
    const channel = member.guild.channels.find(ch => ch.name === 'ｖ﹞main-chat')

    if(channel) channel.send(`Everyone, greet ${member}! Welcome to Valarium, your new home! :sweat_smile::raised_hands::fireworks:  ${Contributors} ${Organisers}`).catch(console.error)
  }
  catch(err){
    console.log('ERROR IN GUILD MEMBER ADD', err)
  }
})

async function isAllowedToUseCommand(commandMessage, args, __ENV, type){ //type=mod
  let userRoles = (await __ENV.__VALARIUM_GUILD().fetchMember(commandMessage.author.id)).roles.map(role => role.name)
  
  if( type === 'DANGEROUS' ) return commandMessage.member.hasPermission('Administrator', false, true, true)
  else if( type === 'mod' ) return userRoles.some( role => role === 'Leaders' || role ==='President' )
  else if( type === 'org' ) return userRoles.some( role => role === 'Leaders' || role ==='President' || role === 'Organisers' )
  else return userRoles.some( role => role === 'Leaders' || role === 'President' || role === 'Organisers' )
}
/**
 * Checks whether a message is being watched for reactions
 * @function
 * @async
 * @param {Message} message The message object to check
 * @return {Document} The watched message fetched from DB
 * @since 1.0.0 
 */
async function handleMessage(message){
  try{
    let args = message.content.split(' ')
    if(args[0] === prefix){
      __ENV.__DATABASE_OBJECT.collection('RECORDED_COMMANDS').insertOne({command: message.content, author: message.member.displayName})
      if(await isAllowedToUseCommand(message, args, __ENV, args[1])){
        if (BOT_COMMANDS.hasOwnProperty(args[1])) {
          if(BOT_COMMANDS[args[1]].hasOwnProperty(args[2])){ //allowed commands channel ---- (args.length === 4? commands.hasOwnProperty(args[3]):true)
            BOT_COMMANDS[args[1]][args[2]].call(this, message, args, __ENV)
          }
          else throw new Error(`I couldn't recognise that`)
        }
        else throw new Error(`I couldn't recognise that`)
      }
      else throw new Error(`You don't have permission to use that command`)
    }
    else if(insults.test(message.content)){ //insults handling
      if(__ENV.__WARNING_EXCEPTIONS.includes(message.member.id)) return
      
      BOT_COMMANDS.mod.warn.call(this, message, `val! mod warn ${message.member.id} Swearing This user has used a swear word/insulted someone`.split(' '), __ENV)
      setTimeout(()=>{
        message.delete()
      }, 1000)
    }
    else if(message.channel.id === '571717874146607129'){
      message.react('✅')
      message.react('❌')
    }
  }
  catch(err){console.log('ERROR IN MESSAGE HANDLING: handleMessage\n', err)}
}

__ENV.__VALARIUM_CLIENT.on('message', handleMessage)