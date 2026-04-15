/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSharedComposable } from '@vueuse/core'
import type { MaybeRefOrGetter, WatchOptions, WatchCallback, WatchStopHandle } from 'vue'
import { onBeforeMount, onBeforeUnmount, readonly, ref, toValue, watch } from 'vue'
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

/**
 * Watch for the current joined conversation matching the provided token.
 *
 * @param token token to match against the joined conversation
 * @param callback callback triggered when the joined conversation matches the token
 * @param options watch options
 */
export function watchJoinedConversation(
	token: MaybeRefOrGetter<string | null>,
	callback: WatchCallback<string, string | null | undefined>,
	options?: WatchOptions,
): WatchStopHandle {
	const currentJoinedConversation = useJoinedConversation()

	return watch(currentJoinedConversation, (newToken, oldToken, onCleanup) => {
		const targetToken = toValue(token)
		if (!targetToken || newToken !== targetToken) {
			return
		}

		callback(newToken, oldToken, onCleanup)
	}, options)
}
