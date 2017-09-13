const express = require('express')
const app = express()
const fetch = require('node-fetch')
const { MongoClient } = require('mongodb')
const { insertSearchInDB, latestSearchTerms } = require('./database.js')

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.get('/api/imagesearch/:searchTerm', async (req, res) => {
  try {
    await insertSearchInDB(req.params.searchTerm)
    const json = await searchImages(req.params.searchTerm, req.query.offset, 10)
    res.send(rearrangeJSON(json.items))
  } catch(err) {
    console.log(err)
    res.sendStatus(500)
  }
})

app.get('/api/latest/imagesearch', async (req, res) => {
  try {
    const latestTerms = await latestSearchTerms()
    res.send(latestTerms)
  } catch(err) {
    console.log(err)
    res.sendStatus(500)
  }
})

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

async function searchImages(searchTerm, page, numResults) {
  const start = pagination(page, numResults)
  const uriPath = 'https://www.googleapis.com/customsearch/v1?'
        + `q=${encodeURIComponent(searchTerm)}`
        + '&searchType=image'
        + `&num=${numResults}`
        + `&cx=${process.env.CX}` 
        + `&key=${process.env.CSE_API_KEY}`
        + '&fields=items(link,snippet,image/contextLink,image/thumbnailLink)'
        + `&start=${start}`
  return await (await fetch(uriPath)).json()
}

function rearrangeJSON(json) {
  return json.map( elem => {
    return {
      url: elem.link,
      snippet: elem.snippet,
      thumbnail: elem.image.thumbnailLink,
      context: elem.image.contextLink
    }
  })
}

function pagination(offset, num) {
  const page = offset || 1
  return page * num + 1 - num
}