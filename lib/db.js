import mongoose from 'mongoose'

let cachedConnection = null

export async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.')
  }

  const connection = await mongoose.connect(uri, {
    bufferCommands: false
  })

  cachedConnection = connection
  return connection
}
