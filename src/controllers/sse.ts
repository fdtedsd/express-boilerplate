import { type Request, type Response, Router } from "express"
import { instance as createLogger } from "../utils/logger"
import { ValidatedRequest } from "../types/express"
import { envs } from "../config/env"
import type { BroadcastBody, ConnectionIdParams, HeartbeatEvent, NotificationEvent, SSEConnections, SSEServerEvent } from "../types/sse"

const router = Router()
const logger = createLogger("routes.sse")

const connections: SSEConnections = new Map<string, Response>()
const heartbeatInterval = envs.HEARTBEAT_INTERVAL_MS

const generateConnectionId = (): string => {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getConnection(req: Request, res: Response): void {
  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control"
    })

    const connectionId = generateConnectionId()
    connections.set(connectionId, res)

    const connectedEvent: SSEServerEvent = {
      type: "connected",
      connectionId,
      message: "SSE connection established",
      timestamp: new Date().toISOString()
    }

    res.write(`data: ${JSON.stringify(connectedEvent)}\n\n`)

    req.on("close", () => {
      connections.delete(connectionId)
      try { 
        clearInterval(heartbeat) 
      } catch (error) {
        logger.error("Error clearing heartbeat interval", { connectionId, error })
      }
      logger.info("Client disconnected", { connectionId })
    })

    const heartbeat = setInterval(() => {
      if (connections.has(connectionId)) {
        const heartbeatEvent: HeartbeatEvent = {
          type: "heartbeat",
          timestamp: new Date().toISOString()
        }
        res.write(`data: ${JSON.stringify(heartbeatEvent)}\n\n`)
        logger.debug("Heartbeat sent to client", { connectionId })
      } else {
        logger.info("Connection no longer exists, clearing heartbeat interval", { connectionId })
        clearInterval(heartbeat)
      }
    }, heartbeatInterval)

    logger.info("SSE connection established", { connectionId })
  } catch (error) {
    logger.error("Error establishing SSE connection", { error })
    res.status(500).json({ error: { message: "Failed to establish SSE connection" } })
  }
}

export function sendBroadcast(req: ValidatedRequest<BroadcastBody>, res: Response): void {
  try {
    const { message, type = "notification" } = req.input as BroadcastBody
    logger.info("Processing broadcast request", { message, type, activeConnections: connections.size })

    const data: NotificationEvent = {
      type,
      message,
      timestamp: new Date().toISOString()
    }

    let successCount = 0
    let errorCount = 0

    connections.forEach((clientRes, connectionId) => {
      try {
        clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
        successCount++
        logger.debug("Message sent to client successfully", { connectionId, message, type })
      } catch (error) {
        logger.error("Error sending to client", { connectionId, error })
        connections.delete(connectionId)
        errorCount++
      }
    })

    logger.info("Broadcast completed", { 
      successCount, 
      errorCount, 
      totalConnections: connections.size,
      message,
      type
    })

    res.status(200).json({
      success: true,
      message: "Broadcast sent",
      activeConnections: connections.size,
      sentTo: successCount,
      failedConnections: errorCount
    })
  } catch (error) {
    logger.error("Error in sendBroadcast", { error })
    res.status(500).json({ 
      error: { message: "Failed to send broadcast" } 
    })
  }
}

export function sendToId(req: ValidatedRequest<ConnectionIdParams & BroadcastBody>, res: Response): Response {
  try {
    const { connectionId, message, type = "notification" } = req.input as ConnectionIdParams & BroadcastBody
    logger.info("Processing send to ID request", { connectionId, message, type })

    const clientRes = connections.get(connectionId)
    if (!clientRes) {
      logger.warn("Send to ID failed: Connection not found", { 
        connectionId, 
        message, 
        type,
        activeConnections: connections.size 
      })
      return res.status(422).json({ 
        error: { message: "Connection not found" } 
      })
    }

    const data: NotificationEvent = {
      type,
      message,
      timestamp: new Date().toISOString()
    }

    clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
    logger.info("Message sent to specific client successfully", { 
      connectionId, 
      message, 
      type 
    })
    
    return res.status(200).json({ 
      success: true, 
      message: "Message sent",
      connectionId 
    })
  } catch (error) {
    logger.error("Failed to send message to client", { error })
    return res.status(500).json({ 
      error: { message: "Failed to send message" } 
    })
  }
}

export function getActiveConnections(req: Request, res: Response): void {
  try {
    const connectionInfo = Array.from(connections.keys()).map(id => ({
      connectionId: id,
      connectedAt: new Date().toISOString()
    }))

    res.status(200).json({
      activeConnections: connections.size,
      connections: connectionInfo
    })
  } catch (error) {
    logger.error("Error getting active connections", { error })
    res.status(500).json({ 
      error: { message: "Failed to get active connections" } 
    })
  }
}

export default router
