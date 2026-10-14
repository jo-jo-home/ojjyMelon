FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY fly-relay.js ./relay.js
EXPOSE 8080
CMD ["node", "relay.js"]
