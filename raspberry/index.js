const io = require("socket.io-client");
const SimplePeer = require("simple-peer");
const NodeWebcam = require("node-webcam");
const wrtc = require("wrtc");

const socket = io("http://localhost:3000");
const RPI_PASSWORD = "ifei6000";

let peer;

const webcamOpts = {
  width: 640,
  height: 480,
  frames: 30,
  saveShots: false,
  output: "jpeg",
  device: false,
  callbackReturn: "base64",
};

const webcam = NodeWebcam.create(webcamOpts);

socket.on("connect", () => {
  console.log("Connected to server");
  socket.emit("rpi-auth", RPI_PASSWORD);
});

socket.on("rpi-auth-success", () => {
  console.log("Authentication successful");
  startStreaming();
});

socket.on("rpi-auth-failure", () => {
  console.log("Authentication failed");
  socket.disconnect();
});

function startStreaming() {
  peer = new SimplePeer({
    initiator: true,
    trickle: false,
    wrtc: wrtc,
  });

  peer.on("signal", (data) => {
    socket.emit("offer", data);
  });

  socket.on("answer", (answer) => {
    peer.signal(answer);
  });

  socket.on("candidate", (candidate) => {
    peer.signal(candidate);
  });

  captureAndSendFrames();
}

function captureAndSendFrames() {
  setInterval(() => {
    webcam.capture("frame", (err, data) => {
      if (err) {
        console.error("Error capturing frame:", err);
        return;
      }

      if (peer && peer.connected) {
        peer.send(data);
      }
    });
  }, 1000 / webcamOpts.frames);
}
