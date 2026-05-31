FROM node:20

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]