import fetch from 'node-fetch'
import { addExif } from '../lib/sticker.js'
import { Sticker } from 'wa-sticker-formatter'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let hapus = m.key.participant
  let bang = m.key.id
    
	let stiker = false
	try {
		let [packname, ...author] = args.join` `.split`|`
		author = (author || []).join`|`
		let q = m.quoted ? m.quoted : m
		let mime = (q.msg || q).mimetype || q.mediaType || ''
		if (/webp/g.test(mime)) {
			let img = await q.download?.()
			stiker = await addExif(img, global.packname || '', global.author || '')
		} else if (/image/g.test(mime)) {
			let img = await q.download?.()
			stiker = await createSticker(img, false, global.packname, global.author)
		} else if (/video/g.test(mime)) {
		//	if ((q.msg || q).seconds > 10) throw 'Max 10 seconds!'
			let img = await q.download?.()
			stiker = await mp4ToWebp(img, { packname: global.packname, author: global.author })
		} else if (args[0] && isUrl(args[0])) {
			stiker = await createSticker(false, args[0], '', author, 20)
		} else throw `Reply an image/video/sticker with command ${usedPrefix + command}`
	} catch (e) {
		console.log(e)
		stiker = e
	} finally {
		m.reply(stiker)
	}
	
}
handler.help = ['sticker *[reply media]*']
handler.tags = ['sticker']
handler.command = /^(sfull|sgif|s|sticker|stiker)$/i

export default handler

const isUrl = (text) => text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'))

async function createSticker(img, url, packName, authorName, quality) {
	let stickerMetadata = {
		type: 'full',
		pack: packName,
		author: authorName,
		quality
	}
	return (new Sticker(img ? img : url, stickerMetadata)).toBuffer()
}

async function mp4ToWebp(file, stickerMetadata) {
	if (stickerMetadata) {
		if (!stickerMetadata.pack) stickerMetadata.pack = global.packname
		if (!stickerMetadata.author) stickerMetadata.author = "Sewa? Chat Owner"
		if (!stickerMetadata.crop) stickerMetadata.crop = true
	} else if (!stickerMetadata) {
		stickerMetadata = { pack: `${global.packname}`, author: "Sewa? Chat Owner", crop: true }
	}
	let getBase64 = file.toString('base64')
	const Format = {
		file: `data:video/mp4;base64,${getBase64}`,
		processOptions: {
			crop: stickerMetadata?.crop,
			startTime: '00:00:00.0',
			endTime: '00:00:7.0',
			loop: 0
		},
		stickerMetadata: {
			...stickerMetadata
		},
		sessionInfo: {
			WA_VERSION: '2.2106.5',
			PAGE_UA: 'WhatsApp/2.2037.6 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
			WA_AUTOMATE_VERSION: '3.6.10 UPDATE AVAILABLE: 3.6.11',
			BROWSER_VERSION: 'HeadlessChrome/88.0.4324.190',
			OS: 'Windows Server 2016',
			START_TS: 1614310326309,
			NUM: '6247',
			LAUNCH_TIME_MS: 7934,
			PHONE_VERSION: '2.20.205.16'
		},
		config: {
			sessionId: 'session',
			headless: true,
			qrTimeout: 20,
			authTimeout: 0,
			cacheEnabled: false,
			useChrome: true,
			killProcessOnBrowserClose: true,
			throwErrorOnTosBlock: false,
			chromiumArgs: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--aggressive-cache-discard',
				'--disable-cache',
				'--disable-application-cache',
				'--disable-offline-load-stale-cache',
				'--disk-cache-size=0'
			],
			executablePath: 'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
			skipBrokenMethodsCheck: true,
			stickerServerEndpoint: true
		 }
	}
	let res = await fetch('https://sticker-api.openwa.dev/convertMp4BufferToWebpDataUrl', {
		method: 'post',
		headers: {
			Accept: 'application/json, text/plain, /',
			'Content-Type': 'application/json;charset=utf-8',
		},
		body: JSON.stringify(Format)
	})
	return Buffer.from((await res.text()).split(';base64,')[1], 'base64')
}
