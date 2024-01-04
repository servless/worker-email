export interface EmailMessage<Body = unknown> {
	readonly from: string
	readonly to: string
	readonly headers: Headers
	readonly raw: ReadableStream
	readonly rawSize: number

	setReject(reason: String): void
	forward(rcptTo: string, headers?: Headers): Promise<void>
}

export interface Env {
	data: any
}

export default {
	async email(message: EmailMessage, env: Env, ctx: Content) {
		const [forward, targets, allows, blocks, block_domains, filter_words] = await Promise.all([
			env.data.get('forward'),
			env.data.get('target'),
			env.data.get('allow'),
			env.data.get('block'),
			env.data.get('block_domains'),
			env.data.get('filter_words'),
		])

		// 取正文
		// const { value, done } = await message.raw.getReader().read();
		// if (!done) {
		// 	const rawEmailContent = String.fromCharCode(...value);
		// 	console.log('Raw Email Content:', rawEmailContent);
		// } else {
		// 	console.error('Failed to read raw email content.');
		// }

		// 取 header
		// const headerKeys = Array.from(message.headers.keys());
		// console.log(headerKeys);
		// ["content-type","date","dkim-signature","from","message-id","mime-version","subject","to","x-lms-return-path"]

		if (!forward) {
			console.error('Not found forward email')
			message.setReject('Not found forward email')
			return
		}

		const targetList: string[] = JSON.parse(targets)
		if (targetList !== null && targetList.length > 0) {
			if (targetList.indexOf(message.to) == -1) {
				console.error(`Target address is not allow: ${message.to}`)
				message.setReject('Target address is not allow')
				return
			}
		}

		const allowList: string[] = JSON.parse(allows)
		if (allowList !== null && allowList.length > 0) {
			if (allowList.indexOf(message.from) == -1) {
				console.error(`Address is not allow: ${message.from}`)
				message.setReject('Address is not allow')
				return
			}
		}

		const blockList: string[] = JSON.parse(blocks)
		if (blockList !== null && blockList.length > 0) {
			if (blockList.indexOf(message.from) != -1) {
				console.error(`Address is blocked: ${message.from}`)
				message.setReject('Address is blocked')
				return
			}
		}

		const blockDomains: string[] = JSON.parse(block_domains)
		if (blockDomains !== null && blockDomains.length > 0) {
			for (let i = 0; i < blockDomains.length; i++) {
				const item = blockDomains[i]
				if (message.from.includes(item)) {
					console.error(`Domain(${item}) is blocked: ${message.from}`)
					message.setReject('Domain is blocked')
					return
				}
			}
		}

		const subject = message.headers.get('subject') ?? ''
		const filterWords: string[] = JSON.parse(filter_words)
		if (filterWords !== null && filterWords.length > 0) {
			// console.log(`filterWords count: ${filterWords.length}`)

			for (let i = 0; i < filterWords.length; i++) {
				const item = filterWords[i]
				if (subject.includes(item)) {
					console.error(`SPAM Title(${item}): ${subject}`)
					message.setReject('Spam Title')
					return
				}
			}
		}

		await message.forward(forward)
		console.log('forward success')
	},
}
