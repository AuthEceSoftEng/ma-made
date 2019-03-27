# ma-made-webserver
The Open Data and Services Platform (ODSP) webserver

## Developer guidelines

### Environmental variables
> The applications module uses [dotenv](https://www.npmjs.com/package/dotenv) package for the enrironment variables management.

The following environment variables are the ones required:

- `platform_url` 
| It refers to the port through which the platform is accessible
(e.g. `http://platform_url:port`)

- `apps_vm_url` 
| It refers to the url through which the application module is accessible
(e.g. `http://apps_vm_url:port`)

- `apps_vm_ip`
| The ip of the apps vm
(e.g. `http://apps_vm_ip`)

- `example_app_octopus`
| Example app octopus
(e.g. `http://83.212.106.178:8080`)

- `code_repo_url`
| It refers to the url through which the code repository is accessible
(e.g. `http://code_repo_url:port`)

- `ports_lower_limit`
| It refers to the lower limit of the ports
(e.g. 6000)

- `ports_upper_limit`
| It refers to the upper limit of the ports
(e.g. 7000)

- `ogdsam_url`
| It refers to the url of the odsam 
(e.g. `http://ogdsam_url`)

- `ckan_authorization_key`
| It refers to the authorization key of ckan

- `front_ends_url`
| It refers to the url of the front ends
(e.g. `http://front_ends_url:port`)

- `analytics_vm_url`
| It refers to the url of the vm of analytics
(e.g. `scc-mobileage.lancs.ac.uk:8000`)

- `host`
| It refers to the mongodb host
(e.g. `mongodb://localhost:27017/odsp`)

- `PORT`
(e.g 5000)

### Setup

  1. Do `npm install` to install dependencies. This will also install bower dependencies.
  2. Set all the required environment variables.
  3. Do `npm run dev`.