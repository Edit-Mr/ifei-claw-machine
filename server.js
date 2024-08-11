const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
const RPI_PASSWORD = process.env.RPI_PASSWORD || 'ifei6000'; // Replace with your desired password

let rpiSocket = null;

// Serve static files
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle Raspberry Pi authentication
    socket.on('rpi-auth', (password) => {
        if (password === RPI_PASSWORD) {
            rpiSocket = socket;
            socket.emit('rpi-auth-success', 'Authentication successful');
            console.log('Raspberry Pi authenticated:', socket.id);
        } else {
            socket.emit('rpi-auth-failure', 'Invalid password');
            socket.disconnect();
        }
    });

    // Handle offer from Raspberry Pi
    socket.on('offer', (offer) => {
        if (socket === rpiSocket) {
            socket.broadcast.emit('offer', offer);
        }
    });

    // Handle answer from users
    socket.on('answer', (answer) => {
        if (socket !== rpiSocket) {
            rpiSocket.emit('answer', answer);
        }
    });

    // Handle ICE candidates
    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (socket === rpiSocket) {
            rpiSocket = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
