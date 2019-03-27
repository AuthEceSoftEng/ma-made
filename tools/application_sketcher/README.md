# odsp-sketch-your-application
ODSP application sketcher which enables rapid application prototyping

## Developer guidelines

### Environmental variables
> The applications module uses [dotenv](https://www.npmjs.com/package/dotenv) package for the enrironment variables management.

The following environment variables are the ones required:

- `port` 
| It refers to the port through which this service is accessible
(e.g. 8090)

- `mongo_url` 
| It refers to the mongo url of the odsp web server
(e.g. `mongodb://localhost:27017/odsp`)

### Setup

  1. Do `npm install` to install dependencies. This will also install bower dependencies.
  2. Set all the required environment variables.
  3. Do `npm start`.