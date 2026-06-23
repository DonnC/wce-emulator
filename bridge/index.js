const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const { parseWhatsAppPayload } = require("./utils/payloadParser");
const { constructWebhookPayload } = require("./utils/webhookConstructor");
const { normalizeUssdPayload } = require("./utils/ussdPayloadParser");

const PORT = 3001;
const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL || "http://localhost:8000/chatbot/webhook";
const BOT_USSD_WEBHOOK_URL = process.env.BOT_USSD_WEBHOOK_URL || "http://localhost:8092/ussd/emulator";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());

app.post("/send-to-emulator", (req, res) => {
  try {
    const fullPayload = req.body;
    const simpleMessage = parseWhatsAppPayload(fullPayload);
    io.emit("ui_message", simpleMessage);
    res.status(200).json({ status: "ok", message: "Message sent to emulator" });
  } catch (error) {
    console.error("Error processing WhatsApp payload:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/send-ussd-to-emulator", (req, res) => {
  try {
    const normalizedScreen = normalizeUssdPayload(req.body);
    io.emit("ussd_message", normalizedScreen);
    res.status(200).json({ status: "ok", message: "USSD screen sent to emulator" });
  } catch (error) {
    console.error("Error processing USSD payload:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

io.on("connection", (socket) => {
  console.log("UI client connected:", socket.id);

  socket.on("ui_reply", async (simpleReply) => {
    try {
      const fullWebhookPayload = constructWebhookPayload(simpleReply);
      const response = await axios.post(BOT_WEBHOOK_URL, fullWebhookPayload);
      console.log("Sent WhatsApp reply to bot webhook:", response.status);
    } catch (error) {
      console.error("Error sending WhatsApp reply:", error.message);
    }
  });

  socket.on("ui_ussd_request", async (sessionRequest) => {
    try {
      const response = await axios.post(BOT_USSD_WEBHOOK_URL, sessionRequest);
      const normalizedScreen = normalizeUssdPayload({
        ...response.data,
        sessionId: response.data?.sessionId || sessionRequest.sessionId,
        msisdn: response.data?.msisdn || sessionRequest.msisdn,
        shortCode: response.data?.shortCode || sessionRequest.shortCode,
      });
      socket.emit("ussd_message", normalizedScreen);
    } catch (error) {
      console.error("Error sending USSD request:", error.message);
      socket.emit("ussd_error", {
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to complete USSD request",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("UI client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`
============================================================
  WCE Local Bridge

  Port: ${PORT}
  WhatsApp relay: http://localhost:${PORT}/send-to-emulator
  WhatsApp bot webhook: ${BOT_WEBHOOK_URL}
  USSD relay: http://localhost:${PORT}/send-ussd-to-emulator
  USSD bot webhook: ${BOT_USSD_WEBHOOK_URL}
============================================================
  `);
});
