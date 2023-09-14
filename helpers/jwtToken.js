// const config = require('../config');
const jwt = require('jsonwebtoken');

const privateKey = 'Key';

async function generate(body, expiresIn) {
  return new Promise(function (resolve, reject) {
    jwt.sign(body, privateKey, { expiresIn: expiresIn }, function (err, token) {
      if (err) reject('invalid token');
      else resolve(token);
    });
  });
}


async function generateLoginOld(body) {
  return new Promise(function (resolve, reject) {
    jwt.sign(body, privateKey, { expiresIn: '24h' }, function (err, token) {
      console.log(err);
      if (err) reject({ message: 'invalid token' });
      else resolve(token);
    });
  });
}

function generateLogin(body) {
  try{
    return  jwt.sign(body, privateKey, { expiresIn: '720h' });
  }catch(error){
    console.log("error", error);
  }
}




async function verifyUser(body) {
  return new Promise(function (resolve, reject) {
    jwt.verify(body, privateKey, function (err, decoded) {
      if (err) {
        reject('invalid token');
      } else {
        resolve(decoded);
      }
    });
  });
}



module.exports = {
  generate,
  generateLogin,
  verifyUser,
  };