# stage 1: Build
FROM node:20-alpine AS build

# working directory
WORKDIR /usr/src/app

# using wildcard(*) to copy all package files
COPY package*.json ./

# install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# copy all source codes into the image
COPY . .

# stage 2: Runtime
FROM node:20-alpine AS runtime

WORKDIR /usr/src/app

# copy only production node_modules and built files from the build stage
COPY --from=build /usr/src/app ./

# expose container port 5000
EXPOSE 5000

# start container
CMD ["node", "server.js"]