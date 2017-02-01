FROM sylchauf/rpi-node-fprint

ADD src/ /home/fingerprint-manager

WORKDIR /home/fingerprint-manager

RUN npm install

EXPOSE 80

CMD node /home/fingerprint-manager/app.js
