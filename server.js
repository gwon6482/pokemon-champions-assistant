import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import express from 'express'
import { connectDB } from './api/lib/db.js'

// API 핸들러 import
import pokemonList from './api/pokemon/index.js'
import pokemonById from './api/pokemon/[id].js'
import rosterList from './api/roster/index.js'
import rosterById from './api/roster/[id].js'
import battleRecommend from './api/battle/recommend.js'
import battleRecord from './api/battle/record.js'
import records from './api/records/index.js'
import moves from './api/moves/index.js'
import authLogin from './api/auth/login.js'
import authRegister from './api/auth/register.js'

const app = express()
app.use(express.json())

app.post('/api/auth/login', authLogin)
app.post('/api/auth/register', authRegister)

app.all('/api/pokemon/:id', (req, res) => {
  req.query.id = req.params.id
  return pokemonById(req, res)
})

app.all('/api/pokemon', pokemonList)

app.all('/api/roster/:id', (req, res) => {
  req.query.id = req.params.id
  return rosterById(req, res)
})

app.all('/api/roster', rosterList)

app.post('/api/battle/recommend', battleRecommend)
app.post('/api/battle/record', battleRecord)

app.get('/api/records', records)
app.get('/api/moves', moves)

const PORT = 3001

// MongoDB 연결 완료 후 서버 시작
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API 서버 실행 중: http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('MongoDB 연결 실패:', err.message)
    process.exit(1)
  })
