import { envs } from "@/config/env"
import { Response, ValidatedRequest } from "@/types/express"
import type {
  BroadcastInput,
  HeartbeatEvent,
  MessageInput,
  NotificationEvent,
  SSEConnections,
  SSEServerEvent
} from "@/types/sse"
import { instance as createLogger } from "@/utils/logger"

const logger = createLogger("controllers.sse")

const connections: SSEConnections = new Map<string, Response>()
const heartbeatInterval = envs.HEARTBEAT_INTERVAL_MS

function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36)}`
}

export function connect(req: ValidatedRequest, res: Response): void {
  logger.info("connect called")

  try {
    const connectionId = generateConnectionId()
    connections.set(connectionId, res)

    // Headers específicos para SSE
    // Nota: Headers de CORS são configurados globalmente no app.ts
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "Connection": "keep-alive"
    })

    // Envia evento de conexão estabelecida
    const connectedEvent: SSEServerEvent = {
      type: "connected",
      connectionId,
      message: "SSE connection established",
      timestamp: new Date().toISOString()
    }

    res.write(`data: ${JSON.stringify(connectedEvent)}\n\n`)

    // flushHeaders() força o envio imediato dos headers e dados
    // Isso é necessário porque o compression aguarda a resposta finalizar para comprimir,
    // mas em SSE a conexão nunca fecha, causando buffering
    res.flushHeaders()

    logger.info("connection established", { connectionId })

    // Configura heartbeat
    const heartbeat = setInterval(() => {
      if (connections.has(connectionId)) {
        try {
          const heartbeatEvent: HeartbeatEvent = {
            type: "heartbeat",
            timestamp: new Date().toISOString()
          }
          res.write(`data: ${JSON.stringify(heartbeatEvent)}\n\n`)
          res.flushHeaders() // Força o envio imediato
          logger.debug("heartbeat sent", { connectionId })
        }
        catch (error) {
          logger.error("error sending heartbeat", { connectionId, error })
          clearInterval(heartbeat)
          connections.delete(connectionId)
        }
      }
      else {
        logger.info("connection no longer exists, clearing heartbeat interval", { connectionId })
        clearInterval(heartbeat)
      }
    }, heartbeatInterval)

    // Limpa conexão quando o cliente desconecta
    req.on("close", () => {
      logger.info("request closed", { connectionId })
      connections.delete(connectionId)
      try {
        clearInterval(heartbeat)
      }
      catch (error) {
        logger.error("error clearing heartbeat interval", { connectionId, error })
      }
      logger.info("client disconnected", { connectionId })
    })

    // Trata erros na resposta
    res.on("error", (error) => {
      logger.error("response error", { connectionId, error })
      connections.delete(connectionId)
      clearInterval(heartbeat)
    })
  }
  catch (error) {
    logger.error("error establishing SSE connection", { error })
    res.status(500).json({ error: { message: "Failed to establish connection" } })
  }
}

export function broadcast(req: ValidatedRequest, res: Response): void {
  logger.appendKeys({ activeConnections: connections.size })
  const { content, type = "notification" } = req.input as BroadcastInput
  logger.info("broadcast called", { content, type })

  try {
    const data: NotificationEvent = {
      type,
      content,
      timestamp: new Date().toISOString()
    }

    let successCount = 0
    let errorCount = 0

    connections.forEach((clientRes, connectionId) => {
      try {
        clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
        clientRes.flushHeaders() // Força o envio imediato
        successCount++
        logger.debug("Content sent to client successfully", { connectionId, content, type })
      }
      catch (error) {
        logger.error("Error sending to client", { connectionId, error })
        connections.delete(connectionId)
        errorCount++
      }
    })

    logger.info("Broadcast completed", { successCount, errorCount })

    res.status(200).json({
      success: true,
      message: "Broadcast sent",
      activeConnections: connections.size,
      sentTo: successCount,
      failedConnections: errorCount
    })
  }
  catch (error) {
    logger.error("Error in sendBroadcast", { error })
    res.status(500).json({
      error: { message: "Failed to send broadcast" }
    })
  }
  finally {
    logger.resetKeys()
  }
}

export async function messageConnection(req: ValidatedRequest, res: Response): Promise<void> {
  const { connectionId, content, type = "notification" } = req.input as MessageInput
  logger.appendKeys({ connectionId })
  logger.info("messageConnection called", { content, type })

  try {
    const clientRes = connections.get(connectionId)
    if (!clientRes) {
      logger.warn("connection not found", {
        connectionId,
        content,
        type,
        activeConnections: connections.size
      })
      res.status(422).json({
        error: { message: "Connection not found" }
      })
      logger.resetKeys()
      return
    }

    const data: NotificationEvent = {
      type,
      content,
      timestamp: new Date().toISOString()
    }

    clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
    clientRes.flushHeaders() // Força o envio imediato
    logger.info("content sent")

    res.status(200).json({
      success: true,
      message: "Message sent",
      connectionId
    })
  }
  catch (error) {
    logger.error("failed to send message to client", { error })
    res.status(500).json({
      error: { message: "Failed to send message" }
    })
  }
  finally {
    logger.resetKeys()
  }
}

export async function listActiveConnection(req: ValidatedRequest, res: Response): Promise<void> {
  logger.info("listActiveConnection called")
  try {
    const connectionInfo = Array.from(connections.keys()).map(id => ({
      connectionId: id,
      connectedAt: new Date().toISOString()
    }))

    logger.info("active connections retrieved", { activeConnections: connections.size })

    res.status(200).json({
      activeConnections: connections.size,
      connections: connectionInfo
    })
  }
  catch (error) {
    logger.error("error getting active connections", { error })
    res.status(500).json({
      error: { message: "Failed to get active connections" }
    })
  }
  finally {
    logger.resetKeys()
  }
}
