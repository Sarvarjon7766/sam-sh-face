const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const multer = require('multer')
const startCronJobs = require("./middlewares/cronjob")
const fs = require('fs')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const connectMainDB = require('./config/db')
connectMainDB()
app.use(cors())
app.use(express.json())
startCronJobs()

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))


const { userrouter, departamentrouter, eventroute, postlogrouter } = require('./routes/index')
app.use('/api/user', userrouter)
app.use('/api/departament', departamentrouter)
app.use('/api/events', eventroute)
app.use('/api/post', postlogrouter)

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'Fayl yuklashda xatolik: ' + err.message
    })
  }
  console.error(err.stack)
  res.status(500).send('Serverda xatolik yuz berdi!')
})
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
  console.log('Uploads papkasi yaratildi')
}
app.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT} da ishga tushdi`)
})
