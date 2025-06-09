import routes from "./routes/index"

import cors from "cors"
import express, { Application } from "express"

const app: Application = express()

app.disable("x-powered-by")
app.use(cors({
  exposedHeaders: ["forbbiden-reason"]
}))
app.use(express.json())
app.use("/", routes)

export default app
