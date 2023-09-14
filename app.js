require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
 const home = require('./routes/home');
const index = require('./routes/index');

// require('./startup/prod')(app);

// add cors
app.use(cors());
app.options('*', cors());

app.use('/public', express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));


// Load body parser
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb',extended: true}));

app.use("/", home);
app.use('/api/v1', index);
const port = 3000;
app.listen(port, () => console.log(`Listning on port ${port}.....`));
