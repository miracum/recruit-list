FROM node:12.7.0-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . ./
RUN npm run lint

ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION}
RUN npm run build

FROM nginx:1.17.2-alpine as deploy
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
