var mysql      = require('mysql');

var connection = mysql.createPool({
  connectionLimit : 100,
  host     : process.env.HOST,
  user     : process.env.USER,
  password : process.env.PASSWORD,
  database : process.env.DATATBASE,
});

connection.getConnection(function(err){

if(!err) {
    console.log("Database is connected ... ");
} else {
    console.log("Error connecting database ... ");
}

});

// module.exports = connection;

module.exports = {
	connection
}