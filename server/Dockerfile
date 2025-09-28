FROM node:22-alpine

WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

# Copy package files and Prisma schema BEFORE npm ci
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies (postinstall will run prisma generate)
RUN npm ci --omit=dev

# Ensure Prisma client is generated (idempotent)
RUN npx prisma generate

# Copy the rest of the server code
COPY . .

ENV NODE_ENV=production

# Railway provides PORT as env; app should read process.env.PORT
CMD ["node", "src/index.js"]