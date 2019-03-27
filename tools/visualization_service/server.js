const dotenv = require('dotenv');
dotenv.load(); // Load dotenv in order for global variables to become accessible
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const cors = require('cors')
const fs = require('fs');
//const sslRedirect = require('heroku-ssl-redirect');

const app = express();
const port = process.env.PORT || 9000;
const api = require('./api/index');
const api_data = require('./api/data');

// If we are to use https for serving backend, we are going to need sslRedirect
//app.use(sslRedirect(['staging', 'production']));

// Enable Cross Origin Requests
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// For Heroku deployment
// if(process.env.NODE_ENV === 'production'){
//   // Priority serve any static files.
//   app.use(express.static(path.resolve(__dirname, '../marketing-app/build')));
// }

app.use('/api', api);
app.use('/api/data', api_data);

// For Heroku deployment
// if(process.env.NODE_ENV === 'production'){
//   // All remaining requests return the React app, so it can handle routing.
//   app.get('*', function(request, response) {
//     response.sendFile(path.resolve(__dirname, '../marketing-app/build', 'index.html'));
//   });
// }

let server;

if(process.env.NODE_ENV === 'production'){
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  
  server = https.createServer(options, app).listen(port, () => console.log(`Listening on port ${port}`));

}
else{
  server = app.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = server;
