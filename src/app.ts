import routes from "./routes/index"

import compression from "compression"
import cors from "cors"
import express, { Application } from "express"

const app: Application = express()

app.use(compression())
app.disable("x-powered-by")
app.use(cors({
  exposedHeaders: ["forbbiden-reason"]
}))
app.use(express.json())
app.use("/", routes)

export default app
