# Run locally

To run it locally make sure you have installed Docker in 19.03.0+. 
The microservice should keep working on previous versions, but it needs to change docker-compose files. 

There is a need to define .env file properly with a value of `TWO_CAPTCHA_API_KEY=<token>`

Command to run: `./local`

Simply command `docker-compose up -d` will do not expose a necessery endpoint at port `3000`, 
and will not mount local volume `./scrapes` to storer avatars.

# Testing

To run the test, there is a need to append environment file (.env) with an Account specific data in such structure:

```
ACCOUNTS='[{"username": "<email>", "password": "<password>"}]'
```

Command to run: `./test`

# Development

There is a case to run service in development mode, to get possibility to refresh the program code instantly over work:

Command to run: `./dev`


