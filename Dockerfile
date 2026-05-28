FROM node:18-alpine

WORKDIR /opt/render/project/src

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
