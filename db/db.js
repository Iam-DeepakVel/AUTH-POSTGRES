const Pool = require("pg").Pool;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DATABASE,
  host: process.env.HOST,
  port: process.env.PORT_NUM 
})

module.exports = pool;