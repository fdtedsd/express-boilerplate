import { Router, Request, Response } from "express"

const router = Router()

const connections = new Map<string, Response>()


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
    console.log(`Client disconnected: ${connectionId}`)
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
  }, 30000) // 30 sec

  console.log(`New SSE connection established: ${connectionId}`)
})

router.post("/sse/broadcast", (req: Request, res: Response) => {
  const { message, type = "notification" } = req.body

  if (!message) {
    return res.status(400).json({ error: "Message is required" })
  }

  const data = {
    type,
    message,
    timestamp: new Date().toISOString()
  }

  connections.forEach((clientRes, connectionId) => {
    try {
      clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error(`Error sending to client ${connectionId}:`, error)
      connections.delete(connectionId)
    }
  })

  res.json({
    success: true,
    message: "Broadcast sent",
    activeConnections: connections.size
  })
})

router.post("/sse/send/:connectionId", (req: Request, res: Response) => {
  const { connectionId } = req.params
  const { message, type = "notification" } = req.body

  if (!message) {
    return res.status(400).json({ error: "Message is required" })
  }

  const clientRes = connections.get(connectionId)
  if (!clientRes) {
    return res.status(404).json({ error: "Connection not found" })
  }

  const data = {
    type,
    message,
    timestamp: new Date().toISOString()
  }

  try {
    clientRes.write(`data: ${JSON.stringify(data)}\n\n`)
    res.json({ success: true, message: "Message sent" })
  } catch (error) {
    console.error(`Error sending to client ${connectionId}:`, error)
    connections.delete(connectionId)
    res.status(500).json({ error: "Failed to send message" })
  }
})

router.get("/sse/connections", (req: Request, res: Response) => {
  const connectionInfo = Array.from(connections.keys()).map(id => ({
    connectionId: id,
    connectedAt: new Date().toISOString()
  }))

  res.json({
    activeConnections: connections.size,
    connections: connectionInfo
  })
})

export default router
