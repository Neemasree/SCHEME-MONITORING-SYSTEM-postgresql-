FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .
EXPOSE 5000
CMD ["sh", "-c", "npm run migrate && npm start"]
