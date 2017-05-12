FROM node

RUN npm install -g testarmada-locks

EXPOSE 4765

CMD locks
