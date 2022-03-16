FROM node:14
WORKDIR /usr/src/app
COPY . .
RUN yarn

EXPOSE 587
CMD [ "yarn", "start" ]