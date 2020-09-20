FROM node:12

WORKDIR /app
ADD package.json package-lock.json /app/

RUN npm i

ADD . /app/
CMD npm start
