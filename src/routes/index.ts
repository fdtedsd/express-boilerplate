import { default as HealthRoutes } from "./health"
import { default as AuthRoutes } from "./auth"

const routes = [
  HealthRoutes,
  AuthRoutes
]

export default [...routes]
