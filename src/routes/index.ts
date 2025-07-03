import { default as AuthRoutes } from "./auth"
import { default as HealthRoutes } from "./health"

const routes = [
  HealthRoutes,
  AuthRoutes
]

export default [...routes]
