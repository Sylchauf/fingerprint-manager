# fingerprint-manager


This project help to manage fingerprint devices : 
- Add, edit, remove users 
- Logs scan access 
- Run nodejs server to interact with fingerprint devices 
- Provide Web Interface for administration


First, you must build the docker image

> docker build -t fingerprint-manager .


Then, you can run the contenair

> docker run -d --restart always --name fingerprint-manager --privileged -v /dev/bus/usb:/dev/bus/usb -p 80:80 fingerprint-manager


Acces to the Web Interface

> http://IP
