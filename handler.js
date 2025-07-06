import { smsg } from './lib/simple.js'
import { reSize } from './lib/resize.js'
import { format } from 'util'
import { getDefaultUser, getDefaultChat, getDefaultAkinatorData, getDefaultSettings } from './lib/dataDefaults.js'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import { readFileSync } from 'fs'
import chalk from 'chalk'
import fs from 'fs'
import fetch from 'node-fetch'
import moment from 'moment-timezone'
const quotes = JSON.parse(fs.readFileSync('./lib/quotes.json'))

const { 
proto,
getAggregateVotesInPollMessage
 } = (await import('@adiwajshing/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    if (!chatUpdate)
        return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]


    if (!m)
        return
    if (global.db.data == null)
        await global.loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m)
            return
        m.exp = 0
        m.limit = false
        try {
            let user = global.db.data.users[m.sender]
            if (typeof user !== 'object' || user === null || user === undefined) { // Check for null or undefined too
                global.db.data.users[m.sender] = getDefaultUser(m.name)
                user = global.db.data.users[m.sender] // re-assign user after creation
            } else {
                let defaultUser = getDefaultUser(m.name)
                for (let key in defaultUser) {
                    if (user[key] === undefined) { // Use `undefined` check
                        user[key] = defaultUser[key]
                    }
                    // Specific checks for properties that might need to be numbers
                    if (typeof defaultUser[key] === 'number' && !isNumber(user[key])) {
                         user[key] = defaultUser[key];
                    }
                }
                 // Ensure specific boolean fields are present
                if (typeof user.autolevelup !== 'boolean') user.autolevelup = true; // Default from original if block
                if (typeof user.kingdom !== 'boolean') user.kingdom = true; // Default from original if block
                if (typeof user.banned !== 'boolean') user.banned = false;
                if (typeof user.premium !== 'boolean') user.premium = false;
                if (typeof user.owner !== 'boolean') user.owner = false;
                if (typeof user.registered !== 'boolean') user.registered = false;
                if (typeof user.sewa !== 'boolean') user.sewa = false;
                if (typeof user.Banneduser !== 'boolean') user.Banneduser = false;
                if (typeof user.gamemines !== 'boolean') user.gamemines = false; // from if(user) block
                if (typeof user.shield !== 'boolean') user.shield = false; // from if(user) block

                // Ensure name is set if user was registered but name somehow got removed
                if (user.registered && !user.name) {
                    user.name = m.name;
                }
            }

            let chat = global.db.data.chats[m.chat]
            if (typeof chat !== 'object' || chat === null || chat === undefined) { // Check for null or undefined too
                global.db.data.chats[m.chat] = getDefaultChat()
                chat = global.db.data.chats[m.chat] // re-assign chat after creation
            } else {
                let defaultChat = getDefaultChat()
                for (let key in defaultChat) {
                    if (chat[key] === undefined) { // Use `undefined` check
                        chat[key] = defaultChat[key]
                    }
                }
                // Ensure specific boolean fields are present
                if (typeof chat.isBanned !== 'boolean') chat.isBanned = false;
                if (typeof chat.welcome !== 'boolean') chat.welcome = false; // Default from original if block
                if (typeof chat.detect !== 'boolean') chat.detect = false;
                if (typeof chat.delete !== 'boolean') chat.delete = false; // Default from original else block (anti-delete off)
                if (typeof chat.antiLink !== 'boolean') chat.antiLink = false;
                if (typeof chat.antiLinkAll !== 'boolean') chat.antiLinkAll = false;
                if (typeof chat.antiCall !== 'boolean') chat.antiCall = true; // Default from original if block for existing chats
                if (typeof chat.antiFoto !== 'boolean') chat.antiFoto = false;
                if (typeof chat.antiVideo !== 'boolean') chat.antiVideo = false;
                if (typeof chat.antiSticker !== 'boolean') chat.antiSticker = false;
                if (typeof chat.antiAudio !== 'boolean') chat.antiAudio = false;
                if (typeof chat.viewonce !== 'boolean') chat.viewonce = false;
                if (typeof chat.antiBadword !== 'boolean') chat.antiBadword = false;
                if (typeof chat.simi !== 'boolean') chat.simi = false;
                if (typeof chat.nsfw !== 'boolean') chat.nsfw = false;
                if (typeof chat.premnsfw !== 'boolean') chat.premnsfw = false;
                if (!isNumber(chat.expired)) chat.expired = 0;
            }

            let akinator = global.db.data.users[m.sender].akinator
            if (typeof akinator !== 'object' || akinator === null || akinator === undefined) {
                global.db.data.users[m.sender].akinator = getDefaultAkinatorData();
                akinator = global.db.data.users[m.sender].akinator; // re-assign
            } else {
                let defaultAkinatorData = getDefaultAkinatorData();
                for (let key in defaultAkinatorData) {
                    if (akinator[key] === undefined) {
                        akinator[key] = defaultAkinatorData[key];
                    }
                }
            }

            let settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== 'object' || settings === null || settings === undefined) {
                global.db.data.settings[this.user.jid] = getDefaultSettings();
                settings = global.db.data.settings[this.user.jid]; // re-assign
            } else {
                let defaultSettings = getDefaultSettings();
                for (let key in defaultSettings) {
                    if (settings[key] === undefined) {
                        settings[key] = defaultSettings[key];
                    }
                     // Ensure specific boolean fields are present
                    if (typeof defaultSettings[key] === 'boolean' && typeof settings[key] !== 'boolean') {
                        settings[key] = defaultSettings[key];
                    }
                    // Ensure specific number fields are present
                    if (typeof defaultSettings[key] === 'number' && !isNumber(settings[key])) {
                         settings[key] = defaultSettings[key];
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
        if (opts['nyimak'])
            return
        if (!m.fromMe && opts['self'])
            return
        if (opts['pconly'] && m.chat.endsWith('g.us'))
            return
        if (opts['gconly'] && !m.chat.endsWith('g.us'))
            return
        if (opts['swonly'] && m.chat !== 'status@broadcast')
            return
        if (typeof m.text !== 'string')
            m.text = ''

        const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)

        const isOwner = isROwner || db.data.users[m.sender].ownerTime > 0

        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrems = isROwner || db.data.users[m.sender].premiumTime > 0

        if (opts['queque'] && m.text && !(isMods || isPrems)) {
            let queque = this.msgqueque, time = 1000 * 5
            const previousID = queque[queque.length - 1]
            queque.push(m.id || m.key.id)
            setInterval(async function () {
                if (queque.indexOf(previousID) === -1) clearInterval(this)
                await delay(time)
            }, time)
        }

        if (m.isBaileys)
            return
        m.exp += Math.ceil(Math.random() * 10)

        let usedPrefix
        let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

        const groupMetadata = (m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(_ => null)) : {}) || {}
        const participants = (m.isGroup ? groupMetadata.participants : []) || []
        const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {} // User Data
        const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {} // Your Data
        const isRAdmin = user?.admin == 'superadmin' || false
        const isAdmin = isRAdmin || user?.admin == 'admin' || false // Is User Admin?
        const isBotAdmin = bot?.admin || false // Are you Admin?

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin)
                continue
            if (plugin.disabled)
                continue
            const __filename = join(___dirname, name)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename
                    })
                } catch (e) {
                    // if (typeof e === 'string') continue
                    console.error(e)
                    for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                        let data = (await conn.onWhatsApp(jid))[0] || {}
                        if (data.exists)
                            m.reply(`❲ SISTEM ERROR ❳

❲ 𝐅𝐫𝐨𝐦 𝐏𝐥𝐮𝐠𝐢𝐧𝐬 ❳ : ${name}
❲ 𝐅𝐫𝐨𝐦 𝐒𝐞𝐧𝐝𝐞𝐫 ❳ : ${m.sender}
❲ 𝐅𝐫𝐨𝐦 𝐂𝐡𝐚𝐭 ❳ : ${m.chat}
❲ 𝐅𝐫𝐨𝐦 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 ❳ : ${m.text}

\`\`\`${format(e)}\`\`\`
`.trim(), data.jid)
                    }
                }
            }
            if (!opts['restrict'])
                if (plugin.tags && plugin.tags.includes('admin')) {
                    // global.dfail('restrict', m, this)
                    continue
                }
            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
            let match = (_prefix instanceof RegExp ? // RegExp Mode?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ? // Array?
                    _prefix.map(p => {
                        let re = p instanceof RegExp ? // RegExp in Array?
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? // String?
                        [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                        [[[], new RegExp]]
            ).find(p => p[1])
            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }))
                    continue
            }
            if (typeof plugin !== 'function')
                continue
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `

                command = (command || '').toLowerCase()
                let fail = plugin.fail || global.dfail // When failed
                let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ? // Array?
                        plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof plugin.command === 'string' ? // String?
                            plugin.command === command :
                            false

                if (!isAccept)
                    continue
                m.plugin = name
                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    if (name != 'own-unbanchat.js' && name != 'own-exec.js' && name != 'own-exec2.js' && name != 'own-delete.js' && chat?.isBanned)
                        return // Except this
                    if (name != 'own-unbanuser.js' && user?.banned)
                        return
                }
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) { // Real Owner
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) { // Number Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.mods && !isMods) { // Moderator
                    fail('mods', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) { // Premium
                    fail('premium', m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) { // Group Only
                    fail('group', m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                    fail('botAdmin', m, this)
                    continue
                } else if (plugin.admin && !isAdmin) { // User Admin
                    fail('admin', m, this)
                    continue
                }
                if (plugin.private && m.isGroup) { // Private Chat Only
                    fail('private', m, this)
                    continue
                }
                if (plugin.register == true && _user.registered == false) { // Butuh daftar?
                    fail('unreg', m, this)
                    continue
                }
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 23 // XP Earning per command
                if (xp > 200)
                    m.reply('Ngecit -_-') // Hehehe
                else
                    m.exp += xp
                if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 7) {
                    this.reply(m.chat, `Yah limit Kamu sudah melebihi Batas, Beli limit Dengan Cara *${usedPrefix}shop beli limit 1*`, m)
                    continue // Limit habis
                }
                if (plugin.level > _user.level) {
                    this.reply(m.chat, `Diperlukan Level ${plugin.level} Untuk Menggunakan Perintah Ini\n*Level Kamu:* ${_user.level}`, m)
                    continue // If the level has not been reached
                }
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }
                try {
                    await plugin.call(this, m, extra)
                    if (!isPrems)
                        m.limit = m.limit || plugin.limit || false
                } catch (e) {
                    // Error occured
                    m.error = e
                    console.error(e)
                    if (e) {
                        let text = format(e)
                        for (let key of Object.values(global.APIKeys))
                            text = text.replace(new RegExp(key, 'g'), '-')
                        if (e.name)
                            for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                                let data = (await conn.onWhatsApp(jid))[0] || {}
                                if (data.exists)
                                    m.reply(`❲ REPORT SISTEM ❳

❲ 𝐅𝐫𝐨𝐦 𝐏𝐥𝐮𝐠𝐢𝐧𝐬 ❳ : ${m.plugin}
❲ 𝐅𝐫𝐨𝐦 𝐒𝐞𝐧𝐝𝐞𝐫 ❳ : ${m.sender}
❲ 𝐅𝐫𝐨𝐦 𝐂𝐡𝐚𝐭 ❳ : ${m.chat}
❲ 𝐅𝐫𝐨𝐦 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 ❳ : ${usedPrefix}${command} ${args.join(' ')}
❲ ERROR LOG ❳ : 

\`\`\`${text}\`\`\`

${global.namebot}
`.trim(), data.jid)
                            }
                        m.reply(text)
                    }
                } finally {
                    // m.reply(util.format(_user))
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        //console.log(global.db.data.users[m.sender])
        let user, stats = global.db.data.stats
        if (m) {
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp
                user.limit -= m.limit * 8
            }

            let stat
            if (m.plugin) {
              let rn = ['recording','composing']
              let jd = rn[Math.floor(Math.random() * rn.length)]
              await this.sendPresenceUpdate(jd,m.chat)
                let now = +new Date
                if (m.plugin in stats) {
                    stat = stats[m.plugin]
                    if (!isNumber(stat.total)) stat.total = 1
                    if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
                    if (!isNumber(stat.last)) stat.last = now
                    if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
                } else stat = stats[m.plugin] = {
                    total: 1,
                    success: m.error != null ? 0 : 1,
                    last: now,
                    lastSuccess: m.error != null ? 0 : now
                }
                stat.total += 1

                if (m.isGroup) global.db.data.chats[m.chat].delay = now
                else global.db.data.users[m.sender].delay = now

                stat.last = now
                if (m.error == null) {
                    stat.success += 1
                    stat.lastSuccess = now
                }
            }
        }

        try {
            if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        if (opts['autoread']) await this.readMessages([m.key])
    }
}


/**
 * Handle groups participants update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate 
 */
export async function participantsUpdate({ id, participants, action }) {
    if (opts['self'])
        return
    if (this.isInit)
        return
    if (global.db.data == null)
        await loadDatabase()
    let chat = global.db.data.chats[id] || {}
    let text = ''
    switch (action) {
        case 'add':
        case 'remove':
            if (chat.welcome) {
                let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata
                let member = groupMetadata.participants.length
                let gpname = await this.getName(id)

                for (let user of participants) {
                   let pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                    let ppgc = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                    try {
                        pp = await this.profilePictureUrl(user, 'image')
                        ppgc = await this.profilePictureUrl(id, 'image')
                    } catch (e) {
                    } finally {
                        text = (action === 'add' ? (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc?.toString() || 'unknow') :
                            (chat.sBye || this.bye || conn.bye || 'Bye, @user!')).replace('@user', await this.getName(user))
      this.sendMessage(id, {
                  document: readFileSync('./package.json'),
                  mimetype: 'application/pdf',
                  fileName: ucapan(),
                  fileLength: "99999999999999999999999999999",
                  caption: text,
                  contextInfo: {
forwardingScore: 999,
isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid:newsid,
        newsletterName: global.namebot,
      },
      externalAdReply: {
      title: action === 'add' ? 'W E L C O M E' : ' G O O D  B Y E',
      body: `Group Notification`,
      thumbnailUrl: pp,
      sourceUrl: ``,
      mediaType: 1,
      renderLargerThumbnail: true
      }}}       
          )

                    }
                }
            }
            break
        case 'promote':
            text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
        case 'demote':
            if (!text)
                text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
            text = text.replace('@user', '@' + participants[0].split('@')[0])
            if (chat.detect)
                this.sendMessage(id, { text, mentions: this.parseMention(text) })
            break
    }
}

export async function pollUpdate(message) {
    for (const {
            key,
            update
        }
        of message) {
        if (message.pollUpdates) {
            const pollCreation = await this.serializeM(this.loadMessage(key.id))
            if (pollCreation) {
                const pollMessage = await getAggregateVotesInPollMessage({
                    message: pollCreation.message,
                    pollUpdates: pollCreation.pollUpdates,
                })
                message.pollUpdates[0].vote = pollMessage

                await console.log(pollMessage)
                this.appenTextMessage(message, message.pollUpdates[0].vote || pollMessage.filter((v) => v.voters.length !== 0)[0]?.name, message.message);
            }
        }
    }
}
/**
 * Handle groups update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate 
 */
export async function groupsUpdate(groupsUpdate) {
    if (opts['self'])
        return
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if (!id) continue
        let chats = global.db.data.chats[id], text = ''
        if (!chats?.detect) continue
        if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Deskripsi telah diubah menjadi```\n@desc').replace('@desc', groupUpdate.desc)
        if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Nama Group telah diubah menjadi```\n@subject').replace('@subject', groupUpdate.subject)
        if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Profil Group telah diubah menjadi```').replace('@icon', groupUpdate.icon)
        if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Link Group telah disetel ulang menjadi```\n@revoke').replace('@revoke', groupUpdate.revoke)
        if (!text) continue
        await this.sendMessage(id, { text: text })
    }
}

export async function deleteUpdate(message) {
    try {
        const { fromMe, id, participant } = message
        if (fromMe)
            return
        let msg = this.serializeM(this.loadMessage(id))
        if (!msg)
            return
        let chat = global.db.data.chats[msg.chat] || {}
        if (chat.delete) {
            return
        await this.reply(msg.chat, `
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan barusan
Untuk mematikan fitur ini, ketik
*.disable delete*
`.trim(), msg, {
            mentions: [participant]
        })
        this.copyNForward(msg.chat, msg).catch(e => console.log(e, msg))
    } } catch (e) {
        console.error(e)
    }
}


global.dfail = (type, m, conn) => {
let tag = `@${m.sender.replace(/@.+/, '')}`
  const userTag = `@${m.sender.split("@")[0]}, `
let mentionedJid = [m.sender]
let name = conn.getName(m.sender)
let fkon = { key: { fromMe: false, participant: `${m.sender.split`@`[0]}@s.whatsapp.net`, ...(m.chat ? { remoteJid: '16504228206@s.whatsapp.net' } : {}) }, message: { contactMessage: { displayName: `${name}`, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`}}}
let msg = {
        rowner: '\n> ꜱᴏʀʀy ᴄᴏᴍᴍᴀɴᴅ ɪᴛᴜ ʜᴀɴyᴀ ʙɪꜱᴀ ᴅɪɢᴜɴᴀᴋᴀɴ ᴏʟᴇʜ *_ᴏᴡɴᴇʀ ᴏɴʟy_*!',
        owner: '\n> ꜱᴏʀʀy ᴄᴏᴍᴍᴀɴᴅ ɪᴛᴜ ʜᴀɴyᴀ ʙɪꜱᴀ ᴅɪʟᴀᴋᴜᴋᴀɴ ᴏʟᴇʜ  *ᴏᴡɴᴇʀ ʙᴏᴛ* :!',
        mods: '\n> ꜱᴏʀʀy ᴄᴏᴍᴍᴀɴᴅ ᴛᴛᴜ ʜᴀɴyᴀ ʙɪꜱᴀ ᴅɪɢᴜɴᴀᴋᴀɴ ᴏʟᴇʜ *ᴍᴏᴅᴇʀᴀᴛᴏʀ ʙᴏᴛ',
        premium: '\n> ꜱᴏʀʀy ᴄᴏᴍᴍᴀɴᴅ ᴛᴇʀꜱᴇʙᴜᴛ ᴍᴀꜱᴜᴋ ᴅᴀʟᴀᴍ ᴋᴀᴛᴇɢᴏʀɪ *ᴩʀᴇᴍɪᴜᴍ*, ᴋᴇᴛɪᴋ .ᴩʀᴇᴍɪᴜᴍ ᴜɴᴛᴜᴋ ɪɴꜰᴏ',
        group: '\n> ꜱᴏʀʀy ᴄᴏᴍᴍᴀɴᴅ ɪᴛᴜ ʜᴀɴyᴀ ʙɪꜱᴀ ᴅɪɢᴜɴᴀᴋᴀɴ ᴅɪ *ɢʀᴜᴩ!*',       
        private: '\n> ꜱᴏʀʀy ᴄᴏᴍᴍᴀɴᴅ ɪᴛᴜ ʜᴀɴyᴀ ʙɪꜱᴀ ᴅɪɢᴜɴᴀᴋᴀɴ *ᴩʀɪᴠᴀᴛᴇ ᴍᴇꜱꜱᴀɢᴇ ʙᴏᴛ*',
        botAdmin: '\n> ꜱᴏʀʀy ʙᴏᴛ ʜᴀʀᴜꜱ ᴍᴇɴᴊᴀᴅɪ *ᴀᴅᴍɪɴ!',
        admin: '\n> *ᴀᴅᴍɪɴ ᴏɴʟʏ •* ᴄᴏᴍᴍᴀɴᴅ ɪɴɪ ʜᴀɴʏᴀ ᴜɴᴛᴜᴋ ᴀᴅᴍɪɴ ɢʀᴏᴜᴘ !!',
        restrict: 'Restrict Not Turned On For This Chat',
        unreg: `👋 Hai ${userTag} sebelum menggunakan bot registrasi terlebih dahulu.\n

*▰▱[${global.namebot}]▱▰*

╭─•「 *Via Email*」

 | Text: *.regmail*

> _Example: .regmail @xinzftxira321@gmail.com //your email_

╰─

╭─•「 *Via Otomatis*」

 | Text: *@verify*

> _Example: @verify //Easy_

╰─

╭─•「 *Via Manual*」

 | Text: *.daftar nama.umur*

> _Example: daftar iwak.18 //manual_

╰─

> Silahkan Daftar agar anda tersimpan didalam database, dan bot akan menggingat data anda selalu

▰▱▰▱▰▱▰▱▰▱▰▱`}[type]

        if (msg) return conn.sendMessage(m.chat, {
      text: msg, 
      contextInfo: {
      mentionedJid: conn.parseMention(msg),
      forwardingScore: 9999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
      newsletterJid:newsid,
      newsletterName: `Click Button Here`,
      },
      externalAdReply: {
      title: '乂 A K S E S D I T O L A K,',
      body: '',
      thumbnailUrl: imgbot2,
      sourceUrl: sch,
      mediaType: 1,
      renderLargerThumbnail: true
      }}}, { quoted: fkon})
        }
function ucapan() {
  const time = moment.tz('Asia/Jakarta').format('HH')
  let res = "Udah pagi ni kak masih belum tidur?"
  if (time >= 4) {
    res = "Pagi"
  }
  if (time >= 10) {
    res = "Selamat Siang"
  }
  if (time >= 15) {
    res = "Selamat Sore"
  }
  if (time >= 18) {
    res = "Malam"
  }
  return res
}
function pickRandom(list) {
     return list[Math.floor(Math.random() * list.length)]
     }
let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})
