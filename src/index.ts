import { envs } from "./config/env"
import app from "./app"

const port = envs.APP_PORT

app.listen(port, (): void => {
  console.log(`App listening to port: ${port}`)
})
