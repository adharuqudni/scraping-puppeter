FROM node:16.16.0 as base

WORKDIR /source

RUN apt-get update && apt-get install -y wget
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt-get -y install ./google-chrome-stable_current_amd64.deb 


COPY package*.json /source/
USER root

RUN npm install
COPY . .


EXPOSE 7878
CMD [ "node", "puppeter.js" ]