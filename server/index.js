const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', watch: 'ANTHRA A-40', time: new Date().toISOString() })
})

app.post('/api/inquiry', (req, res) => {
  const { name, email, metal } = req.body
  console.log('Inquiry:', { name, email, metal })
  res.json({ success: true, message: 'We will be in touch shortly.' })
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3003
app.listen(PORT, () => console.log(`ANTHRA server on :${PORT}`))
