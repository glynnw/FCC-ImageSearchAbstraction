const { MongoClient } = require('mongodb')

let _db

async function dbSetup() {
  if(!_db) {
    _db = await MongoClient.connect(process.env.MONGO_URI)
  }
  
  await _db.createCollection('searchTerms', {
  "capped": true,
  "size": 8000,
  "max": 30
  })
  
  return _db.collection('searchTerms')
}

exports.insertSearchInDB = async function(searchTerm) {
  const db = await dbSetup()
  
  try {
    await db.insertOne({ term: searchTerm, date: new Date() })
  } catch(err) {
    console.log(err)
  }
}

exports.latestSearchTerms = async function() {
  const db = await dbSetup()

  return await db
    .find()
    .limit(10)
    .sort({$natural:-1})
    .map(obj => ({ term: obj.term, when: obj.date }))
    .toArray()
}