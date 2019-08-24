FROM node:12.7.0-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./

RUN npm run test:unit
