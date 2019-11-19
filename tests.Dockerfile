FROM node:13.1.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run test:unit
