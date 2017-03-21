FROM node

RUN git clone --recursive git://github.com/TestArmada/locks.git /app \
&& cd /app \
&& npm i 

EXPOSE 4765

CMD node /app/src/server.js
