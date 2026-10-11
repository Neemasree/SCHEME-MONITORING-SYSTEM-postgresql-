FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .
EXPOSE 5000
CMD ["sh", "-c", "npm run migrate && npm start"]
