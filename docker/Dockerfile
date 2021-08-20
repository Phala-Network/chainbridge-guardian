FROM node:16-alpine

RUN apk add --no-cache tini

WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn

ADD . /app/

ENTRYPOINT [ "/sbin/tini", "--" ]

CMD [ "yarn", "start" ]
