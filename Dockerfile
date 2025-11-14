FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_AUKUS_BASE_URL
ARG VITE_EVENTLAB_BASE_URL
ENV VITE_AUKUS_BASE_URL=${VITE_AUKUS_BASE_URL}
ENV VITE_EVENTLAB_BASE_URL=${VITE_EVENTLAB_BASE_URL}

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build:prod

RUN rm -f build/version.json && \
    VERSION=$(node -p "require('./package.json').version") && \
    echo "{ \"version\": \"$VERSION\" }" > build/version.json

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=build /app/build .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
