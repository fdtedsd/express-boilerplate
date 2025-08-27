import path from "path"

import routes from "./routes/index"

import compression from "compression"
import cors from "cors"
import express, { Application } from "express"

const app: Application = express()

// Configuração do compression que exclui streams SSE para evitar problemas de buffering
app.use(compression({
  filter: (req, res) => {
    const contentType = res.getHeaders()["content-type"]
    // Não comprimir streams SSE para evitar problemas de buffering
    return !contentType || !contentType.toString().includes("text/event-stream")
  }
}))
app.disable("x-powered-by")
app.use(cors({
  exposedHeaders: ["forbbiden-reason"]
}))
app.use(express.json())

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "../public")))

app.use("/", routes)

export default app
