FROM node:22-alpine

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set environment
ENV NODE_ENV=production
ENV PORT=8095

# Expose port
EXPOSE 8095

# Start the application
CMD ["node", "src/index.js"]
