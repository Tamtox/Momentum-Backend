FROM node

# Create app directory
WORKDIR /app

# Add package
COPY package.json ./

# Run install
RUN npm i

# Copy source
COPY . .

# Build dist
RUN npm run build

# Expse port
EXPOSE 3001

# Start server
CMD ["npm", "start"]