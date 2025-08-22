import { envs } from "@/config/env"

import knex, { Knex } from "knex"

export const knexConfig: { [key: string]: Knex.Config } = {
  local: {
    client: envs.DB_CLIENT,
    connection: {
      host: envs.DB_HOST,
      port: 5432,
      user: envs.DB_USER,
      password: envs.DB_PASSWORD,
      database: envs.DB_DATABASE
    }
  },
  server: {
    client: envs.DB_CLIENT,
    connection: {
      host: envs.DB_HOST,
      port: envs.DB_PORT,
      user: envs.DB_USER,
      password: envs.DB_PASSWORD,
      database: envs.DB_DATABASE,
      ssl: {
        rejectUnauthorized: false
      }
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }
}

export const dbConfig: Knex.Config = knexConfig[envs.KNEX_ENV]
export const db: Knex = knex(knexConfig[envs.KNEX_ENV])
