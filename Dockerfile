FROM node:18-bullseye

WORKDIR /opt/render/project/src

COPY package*.json ./
RUN npm ci --build-from-source=sqlite3

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
