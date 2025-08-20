import type { Response } from "express"

export type BroadcastBody = {
  message: string
  type?: string
}

export type SendBody = BroadcastBody

export type ConnectionIdParams = {
  connectionId: string
}

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
  message: string
  timestamp: string
}

export type SSEServerEvent = ConnectedEvent | HeartbeatEvent | NotificationEvent

export type SSEConnections = Map<string, Response>


