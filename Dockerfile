FROM node:16.15.1@sha256:57f6f35ef093186f2e57e8fac481acba4ba780c2a09cb18eddddfb24430f4d00 AS build
WORKDIR /app
RUN npm install -g pkg@5.7.0

COPY package.json ./
COPY package-lock.json ./

RUN npm clean-install --no-optional

COPY . .

ARG VERSION=0.0.0
ENV VUE_APP_VERSION=${VERSION} \
    NODE_ENV=production
RUN npm run build

FROM build AS test
RUN npm run test:unit

FROM build AS release

RUN npm prune --production
# hadolint ignore=DL3059
RUN pkg .

FROM gcr.io/distroless/cc-debian11:nonroot@sha256:8cd94ff6028237ccfc5b12433a84fe5013184b1db09f0eed9d0484441c159c4f
WORKDIR /app
USER 65534
EXPOSE 8080
COPY package.json ./
COPY package-lock.json ./
COPY --from=release /app/pkg-dist/list /app/list
ENTRYPOINT [ "/app/list" ]
ARG BUILD_TIME=""
LABEL maintaner="miracum.org" \
    org.opencontainers.image.created=${BUILD_TIME} \
    org.opencontainers.image.authors="miracum.org" \
    org.opencontainers.image.source="https://gitlab.miracum.org/miracum/uc1/recruit/list" \
    org.opencontainers.image.version=${VERSION} \
    org.opencontainers.image.revision=${GIT_REF} \
    org.opencontainers.image.vendor="miracum.org" \
    org.opencontainers.image.title="uc1-recruit-list" \
    org.opencontainers.image.description="Web-based screening list for the MIRACUM patient recruitment system."
