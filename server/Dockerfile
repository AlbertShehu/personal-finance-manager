FROM node:22-alpine

WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

# Copy package files first
COPY package*.json ./

# Disable postinstall to avoid Prisma generate during npm ci
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1

# Install dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the server code
COPY . .

ENV NODE_ENV=production

# Railway provides PORT as env; app should read process.env.PORT
CMD ["node", "src/index.js"]