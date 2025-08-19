import { type Request, type Response, Router } from "express"
import { instance as createLogger } from "../utils/logger"
import { validateBroadcastBody, validateSendRequest } from "../validation/sse"

const router = Router()
const logger = createLogger("routes.sse")

const connections = new Map<string, Response>()
const HEARTBEAT_INTERVAL_MS = 30000 //30seg


const generateConnectionId = (): string => {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}


router.get("/sse/connect", (req: Request, res: Response) => {

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control"
  })


  const connectionId = generateConnectionId()

  connections.set(connectionId, res)


  res.write(`data: ${JSON.stringify({
    type: "connected",
    connectionId,
    message: "SSE connection established",
    timestamp: new Date().toISOString()
  })}\n\n`)


  req.on("close", () => {
    connections.delete(connectionId)
    try { clearInterval(heartbeat) } catch { }
    logger.info("Client disconnected", { connectionId })
  })

  const heartbeat = setInterval(() => {
    if (connections.has(connectionId)) {
      res.write(`data: ${JSON.stringify({
        type: "heartbeat",
        timestamp: new Date().toISOString()
      })}\n\n`)
    } else {
      clearInterval(heartbeat)
    }
  }, HEARTBEAT_INTERVAL_MS)

  logger.info("SSE connection established", { connectionId })
})

router.post("/sse/broadcast", validateBroadcastBody, (req: Request, res: Response) => {
  const { message, type = "notification" } = req.body as { message: string, type?: string }

  const data = {
    type,
    message,
    timestamp: new Date().toISOString()
  }

  connections.forEach((clientRes, connectionId) => {
    try {
      clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      logger.error("Error sending to client", { connectionId, error })
      connections.delete(connectionId)
    }
  })

  res.status(200).json({
    success: true,
    message: "Broadcast sent",
    activeConnections: connections.size
  })
})

router.post("/sse/send/:connectionId", validateSendRequest, (req: Request, res: Response) => {
  const { connectionId } = req.params as { connectionId: string }
  const { message, type = "notification" } = req.body as { message: string, type?: string }

  const clientRes = connections.get(connectionId)
  if (!clientRes) {
    return res.status(422).json({ error: { message: "Connection not found" } })
  }

  const data = {
    type,
    message,
    timestamp: new Date().toISOString()
  }

  try {
    clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
    res.status(200).json({ success: true, message: "Message sent" })
  } catch (error) {
    logger.error("Failed to send message to client", { connectionId, error })
    connections.delete(connectionId)
    res.status(500).json({ error: { message: "Failed to send message" } })
  }
})

router.get("/sse/connections", (req: Request, res: Response) => {
  const connectionInfo = Array.from(connections.keys()).map(id => ({
    connectionId: id,
    connectedAt: new Date().toISOString()
  }))

  res.status(200).json({
    activeConnections: connections.size,
    connections: connectionInfo
  })
})

export default router
