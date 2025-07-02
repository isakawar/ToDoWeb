FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache make gcc g++ python3 bash
RUN npm install
COPY . .
EXPOSE 4000

# Додаю wait-for-it
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Замість CMD запускаю через wait-for-it
CMD ["/wait-for-it.sh", "db:3306", "--", "npm", "start"]