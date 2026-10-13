import { describe, expect, it } from 'vitest'

import type { ChatMessage } from '@/lib/chat-messages'

import { branchParams, branchThroughRowId } from './branch-params'
import { toBranchMessages } from './utils'

const user = (rowId?: number): ChatMessage =>
  ({ id: 'u', role: 'user', parts: [{ type: 'text', text: 'q' }], ...(rowId ? { rowId } : {}) }) as ChatMessage

// One tool turn: three stored text rows, rendered as ONE bubble.
const folded = {
  id: 'a1',
  role: 'assistant',
  rowId: 21,
  parts: [
    { type: 'text', text: 'let me look', sourceRowId: 21 },
    { type: 'tool-call', toolCallId: 'c1', toolName: 'terminal', result: 'ok' },
    { type: 'text', text: 'found it', sourceRowId: 24 },
    { type: 'tool-call', toolCallId: 'c2', toolName: 'terminal', result: 'ok' },
    { type: 'text', text: 'done', sourceRowId: 27 }
  ]
} as ChatMessage

describe('branchThroughRowId', () => {
  it('anchors on the last text row of a bubble that folded several assistant rows', () => {
    expect(branchThroughRowId(toBranchMessages([user(20), folded]))).toBe(27)
  })

  it('falls back to the message row id, then to undefined', () => {
    expect(branchThroughRowId(toBranchMessages([user(20)]))).toBe(20)
    expect(branchThroughRowId(toBranchMessages([user()]))).toBeUndefined()
    expect(branchThroughRowId([])).toBeUndefined()
  })
})

describe('branchParams', () => {
  const base = { key: 'k', sourceSessionId: 's' }

  it('sends the row anchor next to count for a message-level branch', () => {
    expect(branchParams({ ...base, branchCount: 2, branchMessages: toBranchMessages([user(20), folded]) })).toEqual({
      session_id: 's',
      idempotency_key: 'k',
      count: 2,
      through_row_id: 27
    })
  })

  it('sends neither for a whole-chat branch', () => {
    expect(branchParams({ ...base, branchCount: undefined, branchMessages: [] })).toEqual({
      session_id: 's',
      idempotency_key: 'k'
    })
  })
})
