FROM node:22-alpine
EXPOSE 3000
COPY . /app
RUN apk update && \
    apk upgrade && \
    apk add git libgit2-dev krb5-libs && \
    apk add python3 tzdata pkgconfig build-base && \
    mkdir /repo && \
    git init /repo && \
    cd /app && \
    sed  "s/repo: *''/repo: '\/repo'/" config.js.template > config.js && \
    npm install
RUN apk del python3 tzdata pkgconfig build-base && \
    rm -rf /tmp/* /var/cache/apk/*

CMD cd /app && npm run start
