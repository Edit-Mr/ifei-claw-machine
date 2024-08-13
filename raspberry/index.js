const io = require("socket.io-client");
const socket = io("http://localhost:3000");
const RPI_PASSWORD = "ifei6000";

const NodeWebcam = require("node-webcam");
const sharp = require("sharp");

// Set up webcam options
const webcamOptions = {
  width: 640,
  height: 480,
  quality: 100,
  frames: 1,
  delay: 0,
  saveShots: false,
  output: "jpeg",
  device: false,
  callbackReturn: "buffer",
  verbose: false,
};

const webcam = NodeWebcam.create(webcamOptions);

function captureAndSendFrames() {
  setInterval(() => {
    webcam.capture("image", async (err, data) => {
      if (err) {
        console.error("Error capturing image:", err);
        return;
      }
      try {
        const compressedImage = await sharp(data)
          .jpeg({ quality: 70 })
          .toBuffer();
        const base64Image = compressedImage.toString("base64");
        socket.emit("frame", base64Image);
      } catch (err) {
        console.error("Error processing image:", err);
      }
    });
  }, 1000 / 5);
}

socket.on("connect", () => {
  console.log("Connected to server");
  socket.emit("rpi-auth", RPI_PASSWORD);
});

socket.on("rpi-auth-success", () => {
  console.log("Authentication successful");
  captureAndSendFrames();
});

socket.on("rpi-auth-failure", () => {
  console.log("Authentication failed");
  socket.disconnect();
});
