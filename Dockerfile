FROM docker.io/library/node:18.7.0@sha256:a6f295c2354992f827693a2603c8b9b5b487db4da0714f5913a917ed588d6d41 AS build
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm clean-install --omit=optional

COPY . .

ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION} \
    NODE_ENV=production
RUN npm run build

FROM build AS test
RUN npm run test:unit

FROM build AS release
# Prune dependencies for production
RUN npm prune --omit=dev

FROM gcr.io/distroless/nodejs:18@sha256:0ed0c6ee9d1845b4d6f1e707b583c2b6641f402848ce9e98e294f4701ff6ae87
WORKDIR /app
USER 65534
EXPOSE 8080

COPY package.json ./
COPY package-lock.json ./
COPY server/ server/

COPY --from=release /app/node_modules node_modules
COPY --from=release /app/dist dist

CMD [ "/app/server/server.js" ]

ARG BUILD_TIME=""
LABEL maintaner="miracum.org" \
    org.opencontainers.image.created=${BUILD_TIME} \
    org.opencontainers.image.authors="miracum.org" \
    org.opencontainers.image.source="https://gitlab.miracum.org/miracum/uc1/recruit/list" \
    org.opencontainers.image.version=${VERSION} \
    org.opencontainers.image.revision=${GIT_REF} \
    org.opencontainers.image.vendor="miracum.org" \
    org.opencontainers.image.title="recruit-list" \
    org.opencontainers.image.description="Web-based screening list component of MIRACUM recruIT"
