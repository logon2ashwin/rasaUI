# Server Start
export ENVIRONMENT=dev

ENVIRONMENT=dev node server.js 


#Client Start
client/node webserver.js


APP Server
===========


##For Development
pm2 start process.json --env development

##For Production
pm2 start process.json --env development


## URL
    http://iothings-client.s3-website-us-west-2.amazonaws.com/