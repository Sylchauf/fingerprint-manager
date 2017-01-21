FROM sylchauf/node-fprint

ADD src/ /home/fingerprint-manager

CMD /home/fingerprint-manager/app.js
