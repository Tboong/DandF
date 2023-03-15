const config = require('./config/key'); //추가
const port = 3000
const express = require('express')
const app = express()
const mongoose = require('mongoose')

app.get('/', (req, res) => res.send('Hi'))
app.listen(port, () => console.log(`example app listening on port ${port}!`))

mongoose.connect(config.mongoURI
).then(() => console.log('MD'))
.catch(err => console.log(err))
