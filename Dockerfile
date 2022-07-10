FROM docker.io/library/node:16.16.0@sha256:8951351b7c6a2f8ff9ec25eccc087d37a8aeccf9bf911888ff13c76223467466 AS build
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

# Prune dependencies for production
RUN npm prune --production

# hadolint ignore=DL3059
RUN pkg .

FROM gcr.io/distroless/cc-debian11:nonroot@sha256:10798c5d3c3cee4d740037fbf932a8c73d0b920afd5ba5b3d4acd9ae05565b50
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
