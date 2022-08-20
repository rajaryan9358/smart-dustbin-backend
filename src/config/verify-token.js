var jwt = require('jsonwebtoken');
var config = require('./db.js');

function verifyToken(req, res, next) {
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });
    
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
      
    req.userId = decoded.user_id;
    console.log(decoded);
    next();
  });
}

module.exports = verifyToken;