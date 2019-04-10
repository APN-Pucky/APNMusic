# APNMusic

## Requirements
Mplayer, NodeJS, FFMPEG, Youtube-dl

e.g. on debian

```
sudo apt-get install ffmpeg mplayer python-pip nodejs
sudo pip install youtube-dl
```
## Setup
```
npm install
mkfifo mp_fifo
```

## Run it
```
node app.js
```
Opens A web interface on http://localhost:3070 .
![IMG](/img/img.png)
