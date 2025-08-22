import { broadcast, connect, listActiveConnection, messageConnection } from "@/controllers/sse"
import { validate } from "@/validation/sse"
import { Router } from "express"

const router = Router()

router.get("/sse/connect", connect)
router.post("/sse/broadcast", validate("broadcast"), broadcast)
router.post("/sse/send/:connectionId", validate("sendToConnection"), messageConnection)
router.get("/sse/connections", listActiveConnection)

export default router
