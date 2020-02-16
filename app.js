// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3070;
var cp = require('child_process');
var exec = cp.exec;
var execSync = cp.execSync;
var fs = require('fs');
var request = require("request");

var ids = new Array(0);
var titles = new Array(0);
var res = new Array(0);
var paused;
var curtitle="";
var curlength=0;
var curpointer=-1;
var curplaylist=new Array(0);
var curvol;
var cursearch;
var globtick;
var globtime;

prepare();
test();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));


io.on('connection',function(socket) {

  //socket.emit('play',{'title':curtitle, 'len' : curlength});
  //socket.emit('volume',{'vol':curvol});
  //socket.emit('playlist',{'files' : curplaylist});

  sendCurrentPlaylist();
  sendCurrentSong();
  sendCurrentVolume();
  sendCurrentResults();
  sendCurrentAudios();

  socket.on('search', function(data) {
      log("search");
      cursearch = data.search;
      getAudios(data.search);
      getVidIDs(data.search);	
  });
  socket.on('bskip', function() {
      log("bskip");
      prevSong();
  });
  socket.on('pause', function() {
      log("pause");
      paused=!paused;
      mpfifo("pause");
  });
  socket.on('fskip', function() {
      log("fskip");
      nextSong();
  });
  socket.on('clear', function() {
      log("clear");
      clearAll();
  });
  socket.on('shuffle', function() {
      log("shuffle");
      shuffleSong();
  });
  socket.on('random', function() {
      log("random");
      randomSong();
  });
  socket.on('volume', function(data) {
      log("vol");
      curvol = data.vol;
      //socket.broadcast.emit('volume',data);
      sendCurrentVolume();
      mpfifo("volume " + data.vol + " 1");
  });
  socket.on('download', function(data) {
      log("download");
      downloadVid(data.idi);
  });
  socket.on('jump', function(data) {
      log("jump");
      globtime = data.time;
      mpfifo("seek " + data.time + " 2");
  });
  socket.on('appendplay', function(data) {
     log('appendplay');
     curplaylist[curplaylist.length]=res[data.filei];
     curpointer=curplaylist.length-1;
     sendCurrentPlaylist();
     playSong();
  });
  socket.on('append', function(data) {
     log('append');
     curplaylist[curplaylist.length]=res[data.filei];
     if(curplaylist.length==1)playSong();
     sendCurrentPlaylist();
  });

  socket.on('play', function(data) {
     log('play');
     curpointer = data.listi;
     playSong();
  });

  socket.on('remove', function(data) {
     log('remove');
     remove(data.listi,true);
  });

  socket.on('delete', function(data) {
     log('delete');
     for(var i =0; i < curplaylist.length;i++)
     {
	if(curplaylist[i]===res[data.filei])remove(i,false);
     }
     sendCurrentPlaylist();
	log("send");
     del(res[data.filei]);
     getAudios(cursearch);
     getVidIDs(cursearch);	
  });

});

function sendCurrentSong() {
     io.sockets.emit('play',{'title':curtitle, 'len' : curlength});
}
function sendCurrentPlaylist() {
     io.sockets.emit('playlist',{'files' : curplaylist});
}
function sendCurrentVolume() {
     io.sockets.emit('volume',{'vol':curvol});
}
function sendCurrentResults() {
     io.sockets.emit('results',{'ids': ids,'titles' : titles});
}
function sendCurrentAudios() {
     io.sockets.emit('audios',{'files' : res});
}


var str1 = '<button class="yt-uix-button yt-uix-button-size-small yt-uix-button-default yt-uix-button-empty yt-uix-button-has-icon no-icon-markup addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-later-button-sign-in yt-uix-tooltip" type="button" onclick=";return false;" title="'
var str2 = '<a href="/watch?v=';
var str3 = '<img src="//';
//var str4 = '</a><span class=';
var str4 = 'title="'
var str5 = '</span';

function getVidIDs(search){
  request("https://www.youtube.com/results?search_query="+search, function(error, response, body) {
    var res = body.split(str1);
    var debug = false;
    if(debug)console.log(body);
    ids = new Array(0);
    titles = new Array(0);
    for(var i = 1; i < res.length;i++)
    {
  	var prelink = res[i].split(str2)[1];
  	var id = prelink.split('"')[0];
	if(id.indexOf("&") > -1)continue;
	if(debug)console.log("ID: "+ id);
	ids[ids.length] = id;
	var pretitle = res[i].split(str4)[1];
  	 var title = pretitle.split('"')[0];
	//var atitle = pretitle.split('>');
	//var title = atitle[atitle.length-2];
	if(debug)console.log("TITLE: "+ title);
	titles[titles.length] = title.replace("</span","").replace(/(&quot;)|([^a-zA-ZäöüÖÄÜ0-9_\-])/g," ");
	//var link =  "www.youtube.com/watch?v=" + id;
  	//console.log(link);
	//var img = "i.ytimg.com/vi/" + id +"/mqdefault.jpg";
	//console.log(img);
    }
    sendCurrentResults();
  }); 
}

function getAudios(search) {
	res = new Array(0);
	search = search.replace(/([a-zA-Zäöü0-9]+)([^a-zA-Zäöü0-9])*/g,"(?=.*$1)");
	var files = fs.readdirSync("music/audio");
	for(var i =0; i < files.length;i++) {
		if((files[i]).search(new RegExp(search,"i"))!=-1&&fs.statSync("music/audio/"+files[i]).isFile()) {
			res[res.length] = files[i].replace(/\.mp3/i,"");		
		}
	}	
	sendCurrentAudios();
}

function downloadVid(idi) {
  //cmd: youtube-dl --extract-audio --audio-format mp3 --audio-quality 0 https://www.youtube.com/watch?v=
  var stitle = titles[idi];
  var sid = ids[idi];
  console.log(stitle);
  download("https://i.ytimg.com/vi/" + sid +"/mqdefault.jpg","public/img/audio/" + stitle + ".jpg");

  var cmd = "youtube-dl --extract-audio --audio-format mp3 --audio-quality 0 https://www.youtube.com/watch?v=" + sid + ' -o "music/audio/tmp/' + stitle + '.%(ext)s"';
  exec(cmd, function(err,out,code){
    console.log(err);
    //console.log(out);
    console.log("done");
    if(err==null)fs.renameSync("music/audio/tmp/" + stitle + ".mp3" , "music/audio/" + stitle + ".mp3");
  });
}

var download = function(uri, filename){
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename));
  });
};

function stop() {
  if(mprunning())mpfifo("quit");
}

function play(title,file,cancelTick) {
  /*try  {
  execSync('killall -q mplayer');
  }catch (err){}*/
  stop();
  exec('mplayer -slave -quiet -input file=mp_fifo "' + file + '"', function(err,out,code){
	if(curtitle===title) {
            //song done
            nextSong();
        }
  });
  //mpfifo("pause");
}

function remove(index,send) {
     if(index==curpointer)
     {
        clearSong();
     }
     if(curpointer>index)curpointer--;
     var tmplist = new Array(curplaylist.length-1);
     var c=0;
     for(var i =0;i <curplaylist.length;i++)
     {
	if(i==index)continue;
	tmplist[c] = curplaylist[i];
	c++;
     }
     curplaylist = tmplist;
     if(send)sendCurrentPlaylist();
}

function playSong() {
     if(curplaylist[curpointer]===undefined)curpointer=0;
     try{
     play(curplaylist[curpointer],"music/audio/" + curplaylist[curpointer] + ".mp3",stopTick);
     paused=false;
     globtime=0;
     curtitle=curplaylist[curpointer];
     curlength=parseInt(getLength("music/audio/" + curplaylist[curpointer] + ".mp3"));
     stopTick();
     startTick();
     sendCurrentSong();
     }catch(err){
	console.log(err);
    	sendCurrentResults();
	sendCurrentAudios();
        clearAll();
     }
}

function shuffleSong() {
    var j, x, i;
    for (i = curplaylist.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        if(i-1==curpointer)curpointer=j;
        x = curplaylist[i - 1];
        curplaylist[i - 1] = curplaylist[j];
        curplaylist[j] = x;
    }
    sendCurrentPlaylist();
}

function randomSong() {
        clearAll();
	var files = fs.readdirSync("music/audio");
	for(var i =0; i < files.length;i++) {
		if(fs.statSync("music/audio/"+files[i]).isFile()) {
			curplaylist[curplaylist.length] = files[i].replace(/\.mp3/i,"");		
		}
	}
        curpointer = Math.floor(Math.random()*curplaylist.length);
        shuffleSong();
	playSong();
}

function clearAll() {
	clearSong();
	clearList();
}

function clearSong() {
      curtitle="";
      curlength=0;
      curpointer=-1;
      stopTick();
      sendCurrentSong();
      stop();
}

function clearList() {
      curplaylist=new Array(0);
      sendCurrentPlaylist();
}

function prevSong() {
  curpointer--;
  if(curpointer <0)curpointer=curplaylist.length-1;
  playSong();
}

function nextSong() {
  curpointer++;
  if(curpointer >=curplaylist.length)curpointer=0;
  playSong();
}


function mpfifo(cmd) {
  if(mprunning())execSync('echo "' + cmd + '" > mp_fifo');
}

function mprunning() {
	try{
	return execSync("ps -A | grep mplayer").toString().length > 0;
	}catch(err){}
	return false;
}


function getLength(file) {
  return execSync('mplayer -vo null -ao null -frames 0 -identify "'+ file + '" 2>/dev/null | ' +  "sed -ne '/^ID_LENGTH/ {s/[]()|&;<>`'\"'\"'\\\\!$\" []/\\\\&/g;p}'").toString().split('=')[1];
}

function tick() {
	if(!paused)
	{
		globtime++;
		io.sockets.emit('tick', {'val': globtime});
	}
}

function stopTick() {
	clearInterval(globtick);
}

function startTick() {
     globtick = setInterval(tick,1000);
}

function del(title) {
  try {
  execSync('rm "music/audio/' + title + '.mp3"');
  }catch (err){}
  try {
  execSync('rm "public/img/audio/' + title + '.jpg"');
  }catch (err){}
}

function log(str) {
	console.log(str);
}

function prepare() {
  try {
  execSync("rm music/audio/tmp/*");
  }catch (err){}
}

function test() {
	//console.log("asdfasdfasd asdfsadf".replace(/([a-zA-Zäöü0-9]+)([^a-zA-Zäöü0-9])*/g,"(?=.*$1)"));
}

