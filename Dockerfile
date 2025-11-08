FROM node:22-alpine
EXPOSE 3000
COPY . /app
RUN apk update && \
    apk upgrade && \
    apk add git && \
    mkdir /repo && \
    git init /repo && \
    cd /app && \
    sed  "s/repo: *''/repo: '\/repo'/" config.js.template > config.js && \
    npm install && \
    rm -rf /tmp/* /var/cache/apk/*

CMD cd /app && npm run start
