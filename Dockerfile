FROM node:14.3 as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-optional
COPY . ./
ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION}
RUN npm run build

FROM node:14.3-alpine as final
WORKDIR /app
# hadolint ignore=DL3018
RUN apk --no-cache add curl
COPY --from=build /app/dist dist
COPY --from=build /app/server server
COPY package*.json ./
# install again in production mode to avoid copying
# devDependencies to the final image. This is a
# tradeoff between image size and build time.
ENV NODE_ENV=production
RUN npm ci --no-optional
USER node

ARG VERSION=0.0.0
ARG GIT_REF=""
ARG BUILD_TIME=""
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT [ "npm" ]
CMD ["run", "server:start"]

LABEL org.opencontainers.image.created=${BUILD_TIME} \
    org.opencontainers.image.authors="miracum.org" \
    org.opencontainers.image.source="https://gitlab.miracum.org/miracum/uc1/recruit/list" \
    org.opencontainers.image.version=${VERSION} \
    org.opencontainers.image.revision=${GIT_REF} \
    org.opencontainers.image.vendor="miracum.org" \
    org.opencontainers.image.title="uc1-recruit-list" \
    org.opencontainers.image.description="Web-based screening list for the MIRACUM patient recruitment system."
