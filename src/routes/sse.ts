import { getConnection, sendBroadcast, sendToId, getActiveConnections } from "../controllers/sse"
import { validate } from "../validation/sse"

import { Router } from "express"

const router = Router()

router.get("/sse/connect", getConnection)
router.post("/sse/broadcast", validate("sendBroadcast"), sendBroadcast)
router.post("/sse/send/:connectionId", validate("sendToId"), sendToId)
router.get("/sse/connections", getActiveConnections)

export default router
