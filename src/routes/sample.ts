import { getSampleById } from "@/controllers/sample"
import { validateId } from "@/validation/sample"
import { Router } from "express"

const router = Router()

router.post("/sample", validateId, getSampleById)

export default router
