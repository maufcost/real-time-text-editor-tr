const path = require("path");
const express = require("express");
const app = express();
const server = app.listen(process.env.PORT || 3000);
const io = require("socket.io").listen(server);

// Serving static files on the public folder.
app.use(express.static(path.join("public")));

// This is our super advanced database to keep things simple;
let users = [];

// Socket events.
io.sockets.on("connection", (socket) => {

    socket.on("joinRoom", ({ username }) => {

        // Storing user who just connected to our database.
        users.push({ socket_id: socket.id, username });

        // Sending socket event to update list of online users on all the clients.
        io.emit("showOnlineUsers", { users });
    });

    socket.on("textareaChanged", (data) => {
        socket.broadcast.emit("textareaChanged", data);
    });

    socket.on("stoppedTyping", (data) => {
        socket.broadcast.emit("stoppedTyping", data);
    });

    socket.on("disconnect", ({ username }) => {
        const index = users.findIndex(user => user.socket_id === socket.id);
        if (index !== -1) {
            // User found!

            // In case a user starts typing and within the three-second interval
            // disconnects from the page, we need to remove the 'x is typing...'
            socket.broadcast.emit("stoppedTyping", { username: users[index].username });

            // Removing user who disconnected from our database.
            users.splice(index, 1);

            // Sending socket event to update the list of online users on all
            // the clients.
            io.emit("showOnlineUsers", { users });
        }
    });
});
