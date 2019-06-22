const { RichEmbed } = require('discord.js')



/**
 * @since 1.0.0
 * @type {Object}
 * @namespace BOT_COMMANDS
 * @property {Object} org Methods used for organising
 * @property {Object} mod Methods used for moderation 
 * @property {Object} helpers Methods used in org/mod
 */
let BOT_COMMANDS =  {
  /**
   * @since 1.0.0
   * @type {Object}
   * @memberof! BOT_COMMANDS
   * @property {Function} mute
   * @property {Function} unmute
   * @namespace org
   */
  org: {
    /**
    * @description Used to mute members in voice and text channels. This mute is automatically removed after 15 minutes
    * @since 1.0.0
    * @method mute
    * @param {Message} commandMessage The command message containing command parameters
    * @param {Array} args `commandMessage` split using String.prototype.split(' ')
    * @param {Object} __ENV
    * @memberof! BOT_COMMANDS.org
    * @example
    * Discord_Client.on('message', ()=>{mute(message, message.content.split(' '), __ENV)}))
    */
    mute: async (commandMessage, args, __ENV)=>{
      try{
        let mutedMember = await __ENV.__VALARIUM_GUILD().fetchMember(args[3].toString().replace(/<|>|@/ig, ''))
        let slicedReason = args.slice(5).join(' ') || 'Violation of the rules'
        let date = new Date().toString()
        
        mutedMember.addRole('586839490102951936', args[4])
        console.log(mutedMember.roles.some(role => role.id === '586839490102951936'))
        !mutedMember.roles.some(role => role.id === '586839490102951936') ? mutedMember.addRole('586839490102951936'): commandMessage.reply('this user is already muted')

        BOT_COMMANDS.helpers.sendEmbedNotification(
          __ENV, undefined, 
          {
            author: commandMessage.author, 
            description: `${mutedMember} has been muted at ${date} by ${commandMessage.member}`, 
            title:`INFO, ${mutedMember}`, 
            color: 0xfade78,
            footer: date
          }, [
            {name: 'Member', value: `${mutedMember}`}, 
            {name: 'Moderator', value: `${commandMessage.member}`}, 
            {name: 'Reason', value: slicedReason}, 
            {name: 'Status', value: `This user is now muted and will be automatically unmuted in 15 minutes`}
          ], 
          undefined, 
          [__ENV.__MODERATION_NOTICES_CHANNEL()])
        
        setTimeout(()=>{BOT_COMMANDS.org.unmute(commandMessage, args, __ENV)}, 900000) //15 minutes 900000 ms
      }
      catch(err){console.log(err)}
    },
    /**
     * @description Used to unmute muted members in voice and text channels.
     * @since 1.0.0
     * @method unmute
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @memberof! BOT_COMMANDS.org
     * @example
     * //This probably requires more verification
     * Discord_Client.on('message', ()=>{unmute(message, message.content.split(' '), __ENV)}))
     */
    unmute: async (commandMessage, args, __ENV)=>{
      try{
        let mutedMember = await __ENV.__VALARIUM_GUILD().fetchMember(args[3].toString().replace(/<|>|@/ig, ''))
        let date = new Date().toString()
        console.log(mutedMember.roles.some(role => role.id === '586839490102951936'))
        mutedMember.roles.some(role => role.id === '586839490102951936')? mutedMember.removeRole('586839490102951936'): commandMessage.reply('this user is not muted')
        
        BOT_COMMANDS.helpers.sendEmbedNotification(
          __ENV, undefined, 
          {
            author: commandMessage.author, 
            description: `${mutedMember} has been unmuted at ${date} by ${commandMessage.member}`, 
            title:`INFO, ${mutedMember}`, 
            color: 0xfade78,
            footer: date
          }, [
            {name: 'Member', value: `${mutedMember}`}, 
            {name: 'Moderator', value: `${commandMessage.member}`}, 
            {name: 'Status', value: `This user is now unmuted. Happy talking!`}
          ], 
          undefined, 
          [__ENV.__MODERATION_NOTICES_CHANNEL()])
      }
      catch(err){console.log(err)}
    }
  },
  /**
   * @since 1.0.0
   * @type {Object}
   * @memberof! BOT_COMMANDS
   * @property {Function} clear
   * @property {Function} warn
   * @property {Function} warnings
   * @property {Function} reactionRoles
   * @property {Function} ban
   * @property {Function} unban
   * @namespace mod
   */
  mod: {
    /**
     * @description Sends a specific message to all members of the guild
     * @since 1.0.0
     * @method dmAllMembers
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @memberof! BOT_COMMANDS.mod
     */
    dmAllMembers: async (commandMessage, args, __ENV)=>{
      try{
        __ENV.__VALARIUM_GUILD().members.forEach(async member=>{
          let memberDM = await member.createDM()
          await memberDM.send(args[3])
        })
      }
      catch(err){
        console.log(err)
      }
    },
    /**
     * @description Deletes the supplied number of messages (defaults to 5)
     * @since 1.0.0
     * @method clear
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @memberof! BOT_COMMANDS.mod
     * @example
     * //This probably requires more verification
     * Discord_Client.on('message', ()=>{clear(message, message.content.split(' '), __ENV)}))
     */
    clear: async (commandMessage, args, __ENV)=>{
      try{
        let deletedMessages = await commandMessage.channel.bulkDelete(args[3]? parseInt(args[3]): 5)
        deletedMessages = deletedMessages.map(message=>({author: {name: message.author.username, id: message.author.id}, content: message.content}))
        await __ENV.__DATABASE_OBJECT.collection('DELETED_MESSAGES').insertMany(deletedMessages)
      }
      catch(err){
        console.log(err)
      }
    },
    /**
     * @description Adds a warning to a member. When a member has 3 or more warnings they'll be banned
     * @since 1.0.0
     * @method warn
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @memberof! BOT_COMMANDS.mod
     * @example
     * //This probably requires more verification
     * Discord_Client.on('message', ()=>{warn(message, message.content.split(' '), __ENV)}))
     */
    warn: async (commandMessage, args, __ENV)=>{
      try{
        let warnedMember = await __ENV.__VALARIUM_GUILD().fetchMember(args[3].toString().replace(/<|>|@/ig, ''))
        let slicedReason = args.slice(5).join(' ')

        let userWarnings = (await __ENV.__DATABASE_OBJECT.collection('GUILD_WARNINGS').findOneAndUpdate({USER_ID: warnedMember.id}, {
          '$push': { 
            RECORDED_WARNINGS: {
              WARNING_REASON_NAME: args[4],
              WARNING_REASON_DESCRIPTION: slicedReason,
              WARNING_DATE: new Date().toString()
            }   
          }
        }, {upsert: true, returnOriginal: false})).value

        let date = new Date().toString()
        
        BOT_COMMANDS.helpers.sendEmbedNotification(
          __ENV, warnedMember, 
          {
            author: commandMessage.author, 
            description: `${warnedMember} has been warned at ${date} by ${commandMessage.member}`, 
            title:`WARNING, ${warnedMember}`, 
            color: 0xfade78,
            footer: date
          }, [
            {name: 'Member', value: `${warnedMember}`}, 
            {name: 'Moderator', value: `${commandMessage.member}`}, 
            {name: 'Reason', value: slicedReason}, 
            {name: 'Status', value: `This user now has ${userWarnings.RECORDED_WARNINGS.length} warnings`}
          ], 
          [], 
          [__ENV.__MODERATION_NOTICES_CHANNEL()])

        if(userWarnings.RECORDED_WARNINGS.length === 3){
          BOT_COMMANDS.mod.ban(commandMessage, args, __ENV, 'Warned 3 times')
        }
      }
      catch(err){console.log(err)}
    },
    /**
     * @description Tells the number of warnings a user has
     * @since 1.0.0
     * @method warnings
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @memberof! BOT_COMMANDS.mod
     * @example
     * //This probably requires more verification
     * Discord_Client.on('message', ()=>{warnings(message, message.content.split(' '), __ENV)}))
     */
    warnings: async (commandMessage, args, __ENV)=>{
      try{
        let warnedMember = await __ENV.__VALARIUM_GUILD().fetchMember(args[3].toString().replace(/<|>|@/ig, ''))
        let userWarnings = await BOT_COMMANDS.helpers.getWarnings(warnedMember, __ENV)
        let fields = []

        if(userWarnings && userWarnings.RECORDED_WARNINGS){
          fields = userWarnings.RECORDED_WARNINGS.map(( warning => ({name: warning.WARNING_REASON_NAME, value:
            warning.WARNING_REASON_DESCRIPTION})))
        }
        
        BOT_COMMANDS.helpers.sendEmbedNotification(
          __ENV, undefined,
          {
            author: commandMessage.author,  
            title:`WARNING LOG, ${warnedMember}`, 
            color: 0xfade78
          }, [
            ...fields,
            {name: 'Member', value: `${warnedMember}`}, 
            {name: 'Moderator', value: `${commandMessage.member}`}, 
            {name: 'Status', value: `This user has ${fields.length} warnings`}
          ], 
          undefined, 
          undefined, 
          (embed)=>{commandMessage.reply(embed)}
        )
      }
      catch(err){console.log(err)}
    },
    /**
     * @description Adds a reaction collector to a message to give roles. Used for adding self-roles
     * @since 1.0.0
     * @method reactionRoles
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @memberof! BOT_COMMANDS.mod
     * @example
     * //This probably requires more verification
     * Discord_Client.on('message', ()=>{reactionRoles(message, message.content.split(' '), __ENV)}))
     */
    reactionRoles: async (commandMessage, args, __ENV)=>{
      try{
        let reactionMessage = await commandMessage.guild.channels.find(ch => `<#${ch.id}>` === args[3]).fetchMessage(args[4])
        let index = 0 
        let expectedReaction = {}
        let botMessage
        let originalCommand = commandMessage.content.toString()

        const inputCollector = commandMessage.createReactionCollector(reaction => reaction)
        botMessage = await commandMessage.reply('please react to the previous message with the reaction you want!')

        inputCollector.on('collect', async reaction=>{
          expectedReaction.name = reaction.emoji.name
          await botMessage.edit('What\'s the expected role for that reaction? Update your message to reflect that!')

          __ENV.__VALARIUM_CLIENT.on('messageUpdate', async (oldMessage, newMessage)=>{
            if(oldMessage.content === originalCommand){
              if(__ENV.__AVAILABLE_ROLES.find(role => role.name === newMessage.content)){
                await reactionMessage.react(reaction.emoji.name)
                botMessage.edit('Successful. Awaiting reactions.')
                
                expectedReaction.role = newMessage.content
                //TODO: FIX ISSUES WITH REACTING AFTER RECORDING THROWING
                const userReactionsCollector = reactionMessage.createReactionCollector(reaction=>reaction.emoji.name === expectedReaction.name)
                __ENV.__DATABASE_OBJECT.collection('WATCHED_MESSAGES').updateOne({
                  CHANNEL_ID: reactionMessage.channel.id,
                  MESSAGE_ID: reactionMessage.id
                },{
                  '$addToSet': { 
                    WATCHED_REACTIONS: {
                      REACTION_NAME: reaction.emoji.name,
                      REACTION_ROLE_ID: __ENV.__AVAILABLE_ROLES.find(role => role.name === newMessage.content).id,
                      REACTION_ROLE_NAME: newMessage.content
                    } 
                  }
                }, {upsert: true})
                
                userReactionsCollector.on('collect', async reaction=>{
                  let users = await reaction.fetchUsers()
                  users.forEach(async user=>{
                    let member = await reactionMessage.guild.fetchMember(user.id)
                    member.addRole(__ENV.__AVAILABLE_ROLES.find(role => role.name === newMessage.content))
                  })
                })
              }
              else{
                commandMessage.reply('that role was not found')
              }
            }
          })
        })
      }
      catch(err){
        console.error(err)
      }
    },
    /**
     * @description Bans a member
     * @since 1.0.0
     * @method ban
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @param {String} reason The reason for the ban, used for audit logs
     * @memberof! BOT_COMMANDS.mod
     * @example
     * //This probably requires more verification
     * Discord_Client.on('message', ()=>{ban(message, message.content.split(' '), __ENV)}))
     */
    ban: async function(commandMessage, args, __ENV, reason){
      try{
        let bannedMember = await __ENV.__VALARIUM_GUILD().fetchMember(args[3].toString().replace(/<|>|@/ig, ''))
        let userWarnings = BOT_COMMANDS.mod.warnings(commandMessage, args, __ENV)
        let date = new Date().toString()

        bannedMember.ban({days: 3, reason})
        
        BOT_COMMANDS.helpers.sendEmbedNotification(__ENV, bannedMember, 
          {
            author: commandMessage.author, 
            description: `${bannedMember} has been warned at ${date} by ${commandMessage.member}`, 
            title:`BAN, ${bannedMember}`, 
            color: 0xfade78,
            footer: date
          }, [
            {name: 'Member', value: `${bannedMember}`}, 
            {name: 'Moderator', value: `${commandMessage.member}`}, 
            {name: 'Reason', value: reason}, 
            {name: 'Status', value: userWarnings.RECORDED_WARNINGS.length === 3? 'This user is now banned': `This user now has ${userWarnings.RECORDED_WARNINGS.length} warnings`}
          ], )
      }
      catch(err){ console.log(err) }
    },
    /**
     * @description Unbans a member
     * @since 1.0.0
     * @method clear
     * @param {Message} commandMessage The command message containing command parameters
     * @param {Array} args `commandMessage` split using String.prototype.split(' ')
     * @param {Object} __ENV
     * @param {String} reason The reason for the unban, used for audit logs
     * @memberof! BOT_COMMANDS.mod
     * @example
     * //This probably requires more verification
     * Discord_Client.on('message', ()=>{unban(message, message.content.split(' '), __ENV)}))
     */
    unban: async function(commandMessage, args, __ENV, reason){
      try{
        let bannedMember = await __ENV.__VALARIUM_CLIENT.fetchUser(args[3].toString().replace(/<|>|@/ig, ''), {cache: true})

        await __ENV.__VALARIUM_GUILD().unban(bannedMember, reason)

        BOT_COMMANDS.helpers.sendEmbedNotification(__ENV, bannedMember, { 
          author: 'VALARIUM', description: 'You\'ve been unbanned from Valarium. Enjoy your stay :tada::hugging:!', title:'NOTIFICATION FROM VALARIUM', color: 0xfade78
        }, [{name: 'Mod: ', value: commandMessage.author}])
      }
      catch(err){console.log(err)}
    },
  },  
  /**
   * @since 1.0.0
   * @type {Object}
   * @memberof! BOT_COMMANDS
   * @property {Function} sendEmbedNotification
   * @property {Function} getWarnings
   * @namespace helpers
   */
  helpers:{
    sendEmbedNotification: async function(__ENV, member = undefined, embedOptions, fields, attachments = undefined, channels = undefined, callback){
      try{
        let embed = new RichEmbed(embedOptions)
        if(fields.length > 0){
          fields.forEach(field => field.name==='Moderator' || field.name==='Member'? embed.addField(field.name, field.value, true): embed.addField(field.name, field.value))
        }
        if(attachments){
          attachments.forEach(attachment=>{
            embed.attachFile(attachment.path)
          })
        }
        embed.setThumbnail('https://lh4.googleusercontent.com/Yic_fQ7O-bo2q1ELjzBTQaR3ljVG-coyKsj87E55QzuxrH4b0K1F2ZchjFVrQ_QBA93fc1xWczkD7LGPMTsO')
        if(channels){
          channels.forEach(channel=>{
            channel.send(embed)
          })
        }
        if(member){
          let DMChannel = await member.createDM()
          DMChannel.send(embed)
        }
        if(callback){
          callback(embed)
        }
      }
      catch(err){console.log(err)}
    },
    getWarnings: async (warnedMember, __ENV)=>{
      try{
        let warnings = await __ENV.__DATABASE_OBJECT.collection('GUILD_WARNINGS').findOne({USER_ID: warnedMember.id})
        return warnings
      }
      catch(err){console.log(err)}
    }
  }
}

module.exports = BOT_COMMANDS