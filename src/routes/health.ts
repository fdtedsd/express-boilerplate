import { health } from "../controllers/healthcheck"

import { Router } from "express"

const router = Router()

router.get("/", health)

export default router
