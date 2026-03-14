const { Pool } = require('pg')
require('dotenv').config()

console.log('Testing URL:', process.env.DIRECT_URL?.replace(/:[^:@]+@/, ':****@'))

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
})

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection failed:', err.message)
    console.error('Error code:', err.code)
  } else {
    console.log('✅ Connection successful! Time:', res.rows[0].now)
  }
  pool.end()
})