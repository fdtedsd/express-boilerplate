
import { refresh, signIn, signUp } from "../controllers/auth"
import { validateRefresh, validateSignIn } from "../validation/auth"

import { Router } from "express"

const router = Router()

router.post("/signin", validateSignIn, signIn)
router.post("/signup", signUp)
router.post("/refresh", validateRefresh, refresh)

export default router