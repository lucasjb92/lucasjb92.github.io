var root_url = "https://api.soundcloud.com";
var client_id_urlstr = 'client_id=48a6f9bb2cf5a7f855af430c381941d4';

var FFT_SIZE = 64; //must be power of two
var numBars   = FFT_SIZE / 2 - 9; //should be less than half the fft size
var firstBarIdx = 3;

var pieceStartX = 2;
var pieceStartY = 100;

var pieceX= pieceStartX;
var pieceY = pieceStartY;
var pieceSize;
var pieceColor = "#FFFFFF";

var leftMove = false;
var rightMove = false;
var upMove = false;
var downMove = false;

var moveAmt = 2;

var barCenter = new Array();

var player;
var audioCtx;
var source;
var analyser;
var aud_processor;
$( document ).ready(function() 
{
	player = document.getElementById('audio_player');	
	player.crossOrigin = "anonymous";	
	
	//create the audio context
	audioCtx = new (window.AudioContext || window.webkitAudioContext);	
	
	//create fft analyzer for audio frequency data
	analyser = audioCtx.createAnalyser();
    analyser.fftSize = FFT_SIZE;	

	//use our player as the audio source
	source = audioCtx.createMediaElementSource(player);	
	
	//create audio processor used to register audioprocess events
	aud_processor = audioCtx.createScriptProcessor(1024,1,1);
	aud_processor.onaudioprocess = function onProcess() {
		var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
		
		drawScreen(array);
		
	};
	
	//hook up all our nodes:
	source.connect(analyser);
	analyser.connect(aud_processor);
	analyser.connect(audioCtx.destination);
	aud_processor.connect(audioCtx.destination);
		
	//init bars:
	for(var k = 0; k < numBars; k++) {
		barCenter[k] = Math.random();
	}	
	
});

 
function resolve_audio_url()
{
	var song_url = document.getElementById('url_input_field').value;
	
	//we must get the track resource id from the track url, and request the audio data using the id
	var req_url = root_url.concat('/resolve?url=').concat(song_url).concat('&').concat(client_id_urlstr);
	
	$.get(req_url, function(data){parse_resolve(data);});		
} 

function parse_resolve(data)
{
	console.log(data.stream_url);
	
	var req_url = data.stream_url.concat('?').concat(client_id_urlstr);
	
	player.setAttribute('src', req_url);
	player.play();		
}

function resetPiece()
{
	leftMove  = false;
	rightMove = false;
	upMove    = false;
	downMove  = false;
	pieceX    = pieceStartX;
	pieceY    = pieceStartY;	
}
//input is the fft data
function drawScreen(array)
{
	var canv = document.getElementById('myCanvas');
	
		
	var ctx = canv.getContext("2d");
	
	
	var sideBuffer = 30;
	var barBuffer = 10;
	
	pieceSize = 4;
	
	var colSize = (canv.width  - sideBuffer * 2) / numBars;
	var barW = colSize * 0.5;
	
	//clear screen
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canv.width, canv.height);
	
	//draw bars
	for(var i = 0; i < numBars; i++)
	{
		hue = i/numBars * 290;
		barColor = 'hsl(' + hue + ',100%,50%)';		
		ctx.fillStyle = barColor;
		
		//min height is 10% of canvas size, can go up to pieceSize *2
		var barH = array[i + firstBarIdx] / 255 * canv.height * 0.9 + canv.height * 0.1 - pieceSize *2;
		ctx.fillRect(i*colSize +sideBuffer ,barCenter[i]*canv.height - barH/2 ,barW, barH);	
	}
	
	//calc piece move:
	var atRight = false;
	if(leftMove)
	{
		pieceX = Math.max(0, pieceX - moveAmt);
	}
	if(rightMove)
	{
		if(pieceX + moveAmt > canv.width - pieceSize)
		{
			pieceX = canv.width - pieceSize;
			atRight = true;
		}
		else
		{
			pieceX = pieceX + moveAmt
		}
	}
	if(upMove)
	{
		pieceY = Math.max(0, pieceY - moveAmt);
	}
	if(downMove)
	{
		pieceY = Math.min(canv.height - pieceSize, pieceY + moveAmt);
	}
	
	//check whether a bar has impaled the game piece, move back to beginning if so
	ctx.fillStyle = pieceColor;
	var img = ctx.getImageData(pieceX,pieceY,pieceSize,pieceSize);
	var pixels = img.data;
	for( var j = 0; j < pixels.length; j += 4 ) {
		var r = pixels[j];
		var g = pixels[j+1];
		var b = pixels[j+2];
		if( (r != 0) || (g != 0) || (b != 0) ) {
			resetPiece();
			break;
		}				
	}
	
	if(atRight)
	{
		resetPiece();
		
		for(var k = 0; k < numBars; k++) {
			barCenter[k] = Math.random();
		}		
	}

	ctx.fillRect(pieceX,pieceY,pieceSize,pieceSize);
}


$(document).keydown(function(e) {
	switch(e.which) {
		case 65: //a, moves left
			leftMove = true;
			break;
		case 83: //s, moves down
			downMove = true;
			break;
		case 68: //d, moves right
			rightMove = true;
			break;			
		case 87: //w, moves up
			upMove = true;
			break;
		case 32://space, pauses
			e.preventDefault();
			if(player.paused)
				player.play();
			else
				player.pause();
			break;
	}	
});

$(document).keyup(function(e) {
	switch(e.which) {
		case 65: //a, moves left
			leftMove = false;
			break;
		case 83: //s, moves down
			downMove = false;
			break;
		case 68: //d, moves right
			rightMove = false;
			break;			
		case 87: //w, moves up
			upMove = false;
			break;
	}	
});

function get_track_and_play()
{
	resolve_audio_url();
} 