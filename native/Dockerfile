FROM node:22-alpine
WORKDIR /app/bridge
COPY bridge/package.json bridge/package-lock.json ./
RUN npm ci --ignore-scripts
COPY bridge/ ./
COPY appPackage/ /app/appPackage/
RUN npm run build && npm prune --omit=dev --ignore-scripts
ENV NODE_ENV=production
USER node
CMD ["node", "dist/src/server.js"]
