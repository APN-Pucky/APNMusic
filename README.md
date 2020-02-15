# APNMusic

## Requirements
Linux: Mplayer, NodeJS, FFMPEG, Youtube-dl

e.g. on debian

```
sudo apt-get install ffmpeg mplayer python-pip nodejs
sudo pip install youtube-dl
```
## Setup
```
npm install
mkfifo mp_fifo
mkdir public/img/audio
mkdir music/audio
```

## Run it
```
node app.js
```
Opens A web interface on http://localhost:3070 .
![IMG](/img/img.png)
