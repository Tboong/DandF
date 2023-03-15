const express = require('express')
const app = express()
const port = 3000
const mongoose = require('mongoose')

app.get('/', (req, res) => res.send('Hi'))
app.listen(port, () => console.log(`example app listening on port ${port}!`))


mongoose.connect(config.mongoURI
).then(() => console.log('MD'))
.catch(err => console.log(err))