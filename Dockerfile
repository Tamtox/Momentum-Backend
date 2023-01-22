FROM node:18.13.0 as base

# Add package
COPY package.json ./
COPY package-lock.json ./

# Run install
RUN npm install

# Copy source
COPY src ./src
COPY tsconfig.json ./tsconfig.json

# Build dist
RUN npm run build

# Start production image build
FROM gcr.io/distroless/nodejs:18

# Copy node modules and build directory
COPY --from=base ./node_modules ./node_modules
COPY --from=base /dist /dist

# Copy static files
# COPY src/public dist/src/public

# Expse port
EXPOSE 3001

CMD ["dist/index.js"]