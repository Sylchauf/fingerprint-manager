FROM rpi-node-fprint

ADD src/ /home/fingerprint-manager

WORKDIR /home/fingerprint-manager

RUN npm install

CMD node /home/fingerprint-manager/app.js
