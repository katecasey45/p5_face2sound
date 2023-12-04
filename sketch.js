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
// var drawingNose;
var nosePath = [];

let host = '127.0.0.1:8080'; // address of the websockets server
let socket; // the websocket connection

function setup() {
    createCanvas(800, 600);

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
        // got your nose! :*) 
        var nose = currentResult.keypoints[0].position;

        // if(drawingNose){
        //     stroke(0);
        //     strokeWeight(4);
        //     line(pmouseX, pmouseY, mouseX, mouseY);
        // } 

        nosePath.push(createVector(nose.x, nose.y))

        let x = map(mouseX, 0, width, 0, 255)
        let y = map(mouseY, 0)

        noFill()
        stroke(x, 0, 255);
        strokeWeight(mouseY / 10)
        
        beginShape();
        for (var i = 0; i < nosePath.length; i++){
            vertex(nosePath[i].x, nosePath[i].y)
        } endShape();


        // ellipse(nose.x, nose.y, 50); // draw a nose

        note = map(nose.x, 0, width, 0, 25); // note is 0-25 based on left-right position of nose
        duration = map(nose.y, 0, height, 0, 16); // note length (0-16) based on up-down nose position

        // drawingNose = createVector(nose.x, nose.y);
    }
}

// send a note message every time a key is pressed
function keyPressed() {
    sendNote(int(note), int(duration));
}

// send the note message to the ws server
function sendNote(noteNumber, noteLength) {
    
    // don't continue if the numbers are weird
    if (noteNumber < 0 || noteNumber > 25 || noteLength < 0 || noteLength > 16) {
        console.log("bad arguments sent to SendNote: " + noteNumber + " & " + noteLength);
        return;
    }

    // convert noteNumber (0-25) to a note (A-Z)
    let note;
    // pilot accepts notes as A,B,C,D,E,F,G - but it also accepts H-Z!
    // with H-Z, it transposes (ie: 'H' is 'A' of the next octave up, 'I' is 'B', etc!)
    // ... so converting a number to a note is easy (fromCharCode line below)
    note = 'note:'                              // a message looks like "note:02Bff"
        + '02'                                  // voice #0, starting octave 2
        + String.fromCharCode(65 + noteNumber)  // gives us A-Z (in caps)
        + 'f'                                   // full velocity
        + noteLength.toString(16);              // duration in hexadecimal (0-f)

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