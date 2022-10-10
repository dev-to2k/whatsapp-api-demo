const { Client, LocalAuth } = require("whatsapp-web.js");
const app = require("express")();
const http = require("http");
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);
const bodyParser = require("body-parser");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: false },
});

client.on("authenticated", (session) => {
  // Save the session object however you prefer.
  // Convert it to json, save it to a file, store it in a database...
  console.info("session", session);
});

client.initialize();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

app.post("/send-message", (req, res) => {
  const number = req.body.number;
  const message = req.body.message;

  client
    .sendMessage(number, message)
    .then((response) => {
      res.status(200).json({
        status: true,
        message: "Message sent successfully",
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "Message failed to send",
        response: err,
      });
    });
});

// Socket IO
io.on("connection", (socket) => {
  socket.emit("message", "Connecting...");

  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("message", "Whatsapp is ready!");
  });
});

server.listen(8080, () => {
  console.log("Server is running on port 8080");
});
