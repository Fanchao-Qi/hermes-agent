import type { BranchMessage } from './utils'

/**
 * Durable row id of the LAST stored text row behind the last branch bubble.
 *
 * The renderer folds a tool turn's several assistant rows into one bubble, so a bubble count is not a row
 * count; the backend cuts its row list at this id instead.
 */
export function branchThroughRowId(messages: BranchMessage[]): number | undefined {
  const source = messages.at(-1)?.source

  if (!source) {
    return undefined
  }

  const ids = source.parts.flatMap(part =>
    part.type === 'text' && typeof part.sourceRowId === 'number' ? [part.sourceRowId] : []
  )

  if (ids.length) {
    return Math.max(...ids)
  }

  return typeof source.rowId === 'number' ? source.rowId : undefined
}

interface BranchParamsInput {
  branchCount: number | undefined
  branchMessages: BranchMessage[]
  key: string
  sourceSessionId: null | string
}

/** `session.branch` / `session.branch_whole` params. `count` counts bubbles, the backend counts stored
 * rows, so a message-level branch also carries `through_row_id` to keep folded tool turns whole. */
export function branchParams({ branchCount, branchMessages, key, sourceSessionId }: BranchParamsInput) {
  const throughRowId = branchCount === undefined ? undefined : branchThroughRowId(branchMessages)

  return {
    session_id: sourceSessionId,
    // Stable per-attempt key: a lost-response retry returns the SAME child (#65410).
    idempotency_key: key,
    ...(branchCount !== undefined ? { count: branchCount } : {}),
    ...(throughRowId !== undefined ? { through_row_id: throughRowId } : {})
  }
}
