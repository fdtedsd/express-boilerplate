import { broadcastSchema, connectionIdSchema } from "../validation/sse"

import type { Response } from "express"
import { z } from "zod"

export type BroadcastInput = z.infer<typeof broadcastSchema>
export type ConnectionId = z.infer<typeof connectionIdSchema>
export type MessageInput = BroadcastInput & ConnectionId

export type ConnectedEvent = {
  type: "connected"
  connectionId: string
  message: string
  timestamp: string
}

export type HeartbeatEvent = {
  type: "heartbeat"
  timestamp: string
}

export type NotificationEvent = {
  type: string
  content: string
  timestamp: string
}

export type SSEServerEvent = ConnectedEvent | HeartbeatEvent | NotificationEvent

export type SSEConnections = Map<string, Response>
