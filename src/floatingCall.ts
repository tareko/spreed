/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Conversation } from './types/index.ts'

import { createApp, defineAsyncComponent, reactive } from 'vue'
import { CONVERSATION } from './constants.ts'
import { ALLOWED_DIRECT_CALL_URL_REGEX } from './floatingCallTrigger.ts'
import { createMemoryRouter } from './router/router.ts'
import { createConversation, fetchConversation } from './services/conversationsService.ts'
import store from './store/index.js'
import pinia from './stores/pinia.ts'
import { NextcloudGlobalsVuePlugin } from './utils/NextcloudGlobalsVuePlugin.js'

/**
 * Initializes the floating container on the page
 *
 * @param url Intercepted URL. One of:
 *            (<...>/apps/spreed/?callUser=<userId>#direct-call)
 *            (<...>/apps/call/<token>#direct-call)
 */
export async function handleStartFloatingCall(url: URL) {
	try {
		const userId = url.searchParams.get('callUser')
		let conversation: Conversation

		if (userId) {
			conversation = (await createConversation({
				roomType: CONVERSATION.TYPE.ONE_TO_ONE,
				participants: { users: [userId] },
			})).data.ocs.data
		} else {
			// Already a conversation token
			const matchGroup = ALLOWED_DIRECT_CALL_URL_REGEX.exec(url.toString())![2]
			conversation = (await fetchConversation(matchGroup)).data.ocs.data
			if (conversation.type !== CONVERSATION.TYPE.ONE_TO_ONE) {
				// Ignore group/public/other conversations and proceed with normal navigation
				window.location.assign(url.href)
				return
			}
		}

		store.dispatch('addConversation', conversation)
		const token = conversation.token

		if (!window.OCA.Talk) {
			window.OCA.Talk = reactive({})
		}

		const floatingCallContainer = document.createElement('div')
		floatingCallContainer.id = `talk-floating-call-${token}`
		document.body.appendChild(floatingCallContainer)
		const router = createMemoryRouter()

		const FloatingCallOverlay = defineAsyncComponent(() => import('./FloatingCallOverlay.vue'))
		const instance = createApp(FloatingCallOverlay, {
			token,
		})
			.use(pinia)
			.use(store)
			.use(router)
			.use(NextcloudGlobalsVuePlugin)
		window.OCA.Talk.instance = instance
		window.OCA.Talk.unmountInstance = function() {
			instance.unmount()
			document.body.removeChild(floatingCallContainer)
			delete window.OCA.Talk.instance
			delete window.OCA.Talk.unmountInstance
		}

		instance.mount(document.getElementById(`talk-floating-call-${token}`)!)
	} catch (error) {
		console.error(error)
	}
}
