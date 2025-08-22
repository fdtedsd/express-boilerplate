import { default as HealthRoutes } from "./health"
import { default as SSERoutes } from "./sse"

const routes = [
  HealthRoutes,
  SSERoutes
]

export default [...routes]
