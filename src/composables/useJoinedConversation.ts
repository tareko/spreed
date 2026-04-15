/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSharedComposable } from '@vueuse/core'
import { onBeforeMount, onBeforeUnmount, readonly, ref } from 'vue'
import SessionStorage from '../services/SessionStorage.js'
import { EventBus } from '../services/EventBus.ts'

const joinedConversationToken = ref<string | null>(null)

function readJoinedConversation() {
	joinedConversationToken.value = SessionStorage.getItem('joined_conversation')
}

/**
 * Shared composable exposing the currently joined conversation token.
 */
function useJoinedConversationComposable() {
	onBeforeMount(() => {
		EventBus.on('joined-conversation', readJoinedConversation)
		readJoinedConversation()
	})

	onBeforeUnmount(() => {
		EventBus.off('joined-conversation', readJoinedConversation)
	})

	return readonly(joinedConversationToken)
}

export const useJoinedConversation = createSharedComposable(useJoinedConversationComposable)
