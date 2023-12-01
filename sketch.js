// an example of how to have the position of a face in the webcam's view affect sound
// it requires chaitaigne, configured to map websockets messages to udp messages, which
// are received by the pilot synth application (see the included chataigne .noisette config)

// machine learning computer vision stuff came from: https://editor.p5js.org/makerslab/sketches/Cu4TrKwJI
// websockets stuff came from my demo here: https://github.com/FSUdigitalmedia/p5js_chataigne_demos 

// (note that, unlike all of the other p5js code so far, this one gets all of the required 
//  javascript libraries from the internet, instead of a libraries folder - look at index.html)

var net, video, currentResult, img;
var note = 0;
var duration = 16; // full measure

let host = '127.0.0.1:8080'; // address of the websockets server
let socket; // the websocket connection

function setup() {
  let cnv = createCanvas(800, 800);
  cnv.mouseReleased(sendNote);

  video = createCapture(VIDEO);
  video.elt.addEventListener('loadeddata', videoLoadedCallback);
  video.size(800, 600);
  video.hide();

  // connect to server...
  socket = new WebSocket('ws://' + host);
  socket.onopen = openHandler;
}

function draw() {
  background(255);
  image(video, 0, 0, 800, 600);

  if (currentResult) {
    var nose = currentResult.keypoints[0].position;

    ellipse(nose.x, nose.y, 50)
    // note = 
    // duration = 
    // freq = constrain(map(nose.x, 0, width, 100, 500), 100, 500);
    // amp = constrain(map(nose.y, height, 0, 0, 1), 0, 1);
  }
}

function sendNote() {
  // convert noteNumber (0-25) to a note (A-Z)
  let note;
  // pilot accepts notes as A,B,C,D,E,F,G - but it also accepts H-Z!
  // with H-Z, it transposes (ie: 'H' is 'A' of the next octave up, 'I' is 'B', etc!)
  // ... so converting a number to a note is easy:
  if (noteNumber >= 0 && noteNumber <= 25) { // check that the number is 0-26
    note = String.fromCharCode(65 + noteNumber); // gives us A-Z (in caps)
    note = '02' + note + 'f3'; // voice #0, starting octave 2, full velocity, 1/4 note
  } else {
    console.log("wrong number sent to sendNote()!");
    return;
  }

  // send the note to the websocket server
  // (if the socket is open and ready)
  if (socket.readyState == 1) {
    socket.send(note);
    console.log("Sent: " + note);
  } else {
    console.log("Socket not ready.");
  }
}

//--- websockets handler/callback functions below ---//

function openHandler() {
  console.log("Connected to socket server at " + host);
}

//--- machine learning handler/callback functions below ---//

function videoLoadedCallback() {
  print("Video Loaded");
  posenet.load().then(loadedCallback);
}

function loadedCallback(model) {
  print("Model loaded!");
  net = model;
  net.estimateSinglePose(video.elt).then(estimateCallback);
}

function estimateCallback(result) {
  currentResult = result;
  net.estimateSinglePose(video.elt).then(estimateCallback);
}