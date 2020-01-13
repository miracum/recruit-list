FROM node:13.6-alpine as base
WORKDIR /app

FROM base as build
COPY package*.json ./
RUN npm ci --no-optional
COPY . ./
ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION}
RUN npm run build

FROM base as final
COPY --from=build /app/dist dist
COPY --from=build /app/server server
COPY package*.json ./
# install again in production mode to avoid copying
# devDependencies to the final image. This is a
# tradeoff between image size and build time.
ENV NODE_ENV=production
RUN npm ci --no-optional

EXPOSE 3000
ENTRYPOINT [ "npm" ]
CMD ["run", "server:start"]

LABEL maintainer="miracum.org" \
    org.label-schema.schema-version="1.0" \
    org.label-schema.vendor="MIRACUM" \
    org.label-schema.name="recruit-list" \
    org.label-schema.description="Web-based screening list for the MIRACUM patient recruitment system." \
    org.label-schema.vcs-url="https://gitlab.miracum.org/miracum/uc1/recruit/list"
