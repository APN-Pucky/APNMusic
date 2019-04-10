$(function() {
  var socket = io();

  var clicking = false;
  var inposy = false;
  var inposx = false;
  var lasttime = 0;
  var lastvol = 100;
  var divxy = $('#div22');


  $(document).mousedown(function(){
	if(inposy || inposx)clicking = true;
  });

  $(document).mouseup(function(){
	clicking = false;
  });

  $(document).mousemove(function(event){
 	if(!clicking)
	{
		if(event.pageX < divxy.offset().left+2 && event.pageX > divxy.offset().left-2)
		{
			inposx=true;
			$('.divs').css({"cursor" : "ew-resize"});
		}
		else if(event.pageX > divxy.offset().left+2 && event.pageY < divxy.offset().top+2 && event.pageY > divxy.offset().top-2)
		{
			inposy=true;
			$('.divs').css({"cursor" : "ns-resize"});
		}
		else
		{
			inposx=false;
			inposy=false;
			$('.divs').css({"cursor" : "auto"});
		}

	}
	else
	{
		if(inposy)
		{
			var d = event.pageY/$(document).height()*100;
			$('#div21').css({"height" : d + "%"});
			$('#div22').css({"height" : (100-d) + "%"});
		}		
		if(inposx)
		{
			var d = event.pageX/$(document).width()*100;
			$('#div1').css({"width" : d + "%"});
			$('#div2').css({"width" : (100-d) + "%"});
		}
	}
  });

  $('#search_button').click(function() {
	socket.emit('search', {'search': $('#search_input').val()});
  });

  $('#bskip_button').click(function() {
	socket.emit('bskip');
  });

  $('#pause_button').click(function() {
	socket.emit('pause');
  });

  $('#fskip_button').click(function() {
	socket.emit('fskip');
  });

  $('#clear_button').click(function() {
	socket.emit('clear');
  });

  $('#shuffle_button').click(function() {
	socket.emit('shuffle');
  });

  $('#random_button').click(function() {
	socket.emit('random');
  });
  
  $('#vol_slider').on("input change", function() {
	var val = $(this).val();
    	if(val!=lastvol)
	{
		socket.emit('volume',{'vol' : val});
		lastvol = val;
	}
  });

  $('#time_slider').on("input change", function() {
    	var val = $(this).val();
    	if(val!=lasttime)
	{
		socket.emit('jump',{'time' : $(this).val()});
		lasttime = val;
	}
  });

  socket.on('volume', function (data) {
        $('#vol_slider').val(data.vol);
  });

  socket.on('results', function (data) {
	$('.result_div').remove();
	
	for(var i = 0; i < data.ids.length;i++)
	{
		var id = data.ids[i];
		$('#results').append('<div class="result_div" val="' + i + '"><img class="result_img" src="http://i.ytimg.com/vi/' + id + '/mqdefault.jpg"></img><p class="result_title">' + data.titles[i] + '</p></div>');
	}
  	$('.result_div').click(function(){socket.emit('download',{'idi': $(this).attr('val')});});
	
  });

  socket.on('audios',function(data) {
	$('.file_div').remove();
	
	for(var i = 0; i < data.files.length;i++)
	{
		var file = data.files[i];
		$('#results').append('<div class="file_div" val="' + i + '"><img class="file_img" src="img/audio/' + file + ".jpg" + '"></img><p class="file_title">' + file + '</p><p class="file_info">[Downloaded]</p><button class="delete_button" val="' + i + '">Delete</button><button class="appendplay_button" val="' + i + '">Play</button></div>');
	}
  	$('.file_div').click(function(){socket.emit('append',{'filei': $(this).attr('val')});});
  	$('.delete_button').click(function(){socket.emit('delete',{'filei': $(this).attr('val')});return false;});
  	$('.appendplay_button').click(function(){socket.emit('appendplay',{'filei': $(this).attr('val')});return false;});
  });

  socket.on('playlist',function(data) {
	$('.list_item_div').remove();
	
	for(var i = 0; i < data.files.length;i++)
	{
		var file = data.files[i];
		$('#list_div').append('<div class="list_item_div" val="' + i + '"><img class="list_img" src="img/audio/' + file + ".jpg" + '"></img><p class="list_title">' + file + '</p><button class="remove_button" val="' + i + '">Remove</button></div>');
	}
  	$('.list_item_div').click(function(){socket.emit('play',{'listi': $(this).attr('val')});});
  	$('.remove_button').click(function(){socket.emit('remove',{'listi': $(this).attr('val')});return false;});
  });

  socket.on('play',function(data) {
	$('#play').remove();
	
	if(data.title==="") {
		data.len =0;
	}
	else
	{
		$('#current').append('<div id="play"><div id="play_img_div"><img id="play_img" src="img/audio/' + data.title + ".jpg" + '"></img></div><p id="play_title">' + data.title + '</p></div>');
	}
		
	var min = parseInt(data.len/60);
	var min10 = parseInt(min/10);
	var min1 = min-min10*10;
	var sek = data.len-min*60;
	var sek10 = parseInt(sek/10);
	var sek1 = sek-sek10*10;

	$('#time_slider').attr('max',data.len);
	$('#time_number_max').html(min10 + "" + min1+ ":" + sek10+ "" +sek1);
	slide(0);

  	//$('.file_div').click(function(){socket.emit('play',{'filei': $(this).attr('val')});});
  });

  socket.on('tick', function(data) {
	slide(data.val);
  });
  
});

function slide(val) {
	
	var min = parseInt(val/60);
	var min10 = parseInt(min/10);
	var min1 = min-min10*10;
	var sek = val-min*60;
	var sek10 = parseInt(sek/10);
	var sek1 = sek-sek10*10;

	$('#time_number_current').html(min10+ "" + min1+ ":" + sek10+ "" +sek1);
	$('#time_slider').val(val);
}
