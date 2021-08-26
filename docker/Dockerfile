FROM node:16-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn

COPY \
    gulpfile.ts \
    nest-cli.json \
    package.json \
    tsconfig.build.json \
    tsconfig.json \
    /app/
COPY ./src /app/src
RUN yarn prebuild && yarn build

ENTRYPOINT [ "/sbin/tini", "--" ]

CMD [ "yarn", "start" ]
