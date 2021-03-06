const utils = require('./utils');
const NAMES = require('./NAMES.js')
const ObjectId = require('mongodb').ObjectId;
const RESULTS_PER_PAGE = 5;

let add = async (req, db) => {
  if(!req.session.userId) return {error:'Użytkownik nie jest zalogowany', errorCode: 1};
  let data = req.body;
  let validationInfo = validateAndNormalize(data);
  if(validationInfo.error) return validationInfo;
  data.userId = req.session.userId;
  data.timeStamp = utils.getTimeStamp();
  let insertion = await db.collection('offers').insertOne(data);
  return {offerId:insertion.insertedId};
};

let getById = async (offerId, db) => {
  if(!ObjectId.isValid(offerId)) return {error: 'To ogłoszenie nie istnieje'}
  let data = await db.collection('offers').findOne({_id: ObjectId(offerId)});
  if (!data) return {error: 'To ogłoszenie nie istnieje'};
  data.workTime = NAMES.workTime[data.workTime];
  let user = await db.collection('users').findOne({_id: ObjectId(data.userId)});
  data.username = user.username;
  data.industryId = data.industry;
  data.workTimeId = data.workTime;
  data.industry = NAMES.industry[data.industry];
  return {data};
};

let getAll = async (db, filters) => {
  if(filters && filters.workTime == 0) delete filters.workTime;
  if(filters && filters.city) {
    let tmp = filters.city.trim()
    filters.city = tmp.charAt(0).toUpperCase() + tmp.slice(1);
  }
  let offers = await db.collection('offers').find(filters);
  offers = await offers.toArray();
  for(offer of offers) {
    offer.industryId = offer.industry;
    offer.industry = NAMES.industry[offer.industry];
  }
  for(offer of offers) {
    offer.workTimeId = offer.workTime;
    offer.workTime = NAMES.workTime[offer.workTime];
  }
  offers.reverse();
  return offers;
};

let getByPageNumber = async (pageNumber, db) => {
  let from = (pageNumber-1)*RESULTS_PER_PAGE;
  //TODO write this function
};

let getByUserId = async (db, userId) => {
  let offers = await getAll(db, {userId})
  return offers;
};

let removeById = async (offerId, db) => {
  await db.collection('offers').deleteOne({_id: ObjectId(offerId)});
};

let update = async (offer, db) => {
  let validationInfo = validateAndNormalize(offer);
  if(validationInfo.error) return {error: validationInfo};
  let idToUpdate = offer._id;
  delete offer._id;
  await db.collection('offers').updateOne({_id: ObjectId(idToUpdate)}, {$set: offer});
};

let validateAndNormalize = (data) => {
  if(!data.title || !data.description || !data.city || !data.email)
    return {error: 'Nie udało się dodać ogłoszenia', errorCode: 2};
  data.city = data.city.toLowerCase();
  data.city = data.city.charAt(0).toUpperCase() + data.city.slice(1);
  //TODO finish this function
  return {}
}

module.exports = {add, getById, getByUserId, getAll, removeById, update};
