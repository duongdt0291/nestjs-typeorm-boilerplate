FROM node:14-alpine as builder
WORKDIR /app
COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn --production=false
COPY . .
RUN yarn build

RUN  yarn cache clean --all

RUN rm -rf /var/cache/apk/*
RUN rm -rf /usr/local/share/.cache/yarn/*

# ---

FROM node:14-alpine
ENV NODE_ENV production
WORKDIR /app

COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn --production=true
COPY . .
COPY --from=builder /app/dist/ ./dist/

CMD ["node", "dist/main.js"]