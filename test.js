var groove = require('groove');
 
groove.open('music/audio/In Flames - Rusted Nail.mp3', function(err, file) {
  if (err) throw err;
  console.log(file.metadata());
  console.log("duration:", file.duration());
  file.close(function(err) {
    if (err) throw err;
  });
});

//var Mplayer = require('node-mplayer'); 

//var player1 = new Mplayer('music/audio/In Flames - Rusted Nail.mp3');
//player1.play();
