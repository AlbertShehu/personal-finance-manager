FROM node:22-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy app code
COPY . .

ENV NODE_ENV=production

# Start app
CMD ["node", "index.js"]