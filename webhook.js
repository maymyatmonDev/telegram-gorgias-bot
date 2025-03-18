const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Replace with your actual credentials
const GORGIAS_DOMAIN = "maymyatmon-dev.gorgias.com";
const TELEGRAM_BOT_TOKEN = "7087631730:AAFiotv3tMHlzGwYavPxUMGSkRemXeqABc4";
const GORGIAS_EMAIL = "maymyatmon.dev@gmail.com";
const GORGIAS_API_KEY =
  "a8d8c00a229313c334be364bf2212d68af10942a4146aaa22775a15628839275";

app.use(bodyParser.json());

/**
 * ✅ Webhook to receive messages from Telegram
 */
app.post("/webhook", async (req, res) => {
  try {
    console.log(
      "📩 Received Telegram Message:",
      JSON.stringify(req.body, null, 2)
    );

    // Check if the message exists
    const message = req.body.message;
    if (!message || !message.text) {
      console.log("⚠️ No text message found.");
      return res.sendStatus(400);
    }

    const userName = message.from.username || "Unknown User";
    const userMessage = message.text;

    // Create a ticket in Gorgias
    await createGorgiasTicket(userMessage, userName);

    // Respond to Telegram
    await sendTelegramMessage(
      message.chat.id,
      "✅ Your message has been received!"
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error in /webhook:", error);
    res.sendStatus(500);
  }
});

/**
 * ✅ Function to send message back to Telegram
 */
const sendTelegramMessage = async (chatId, text) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, { chat_id: chatId, text: text });
    console.log("📤 Sent message to Telegram");
  } catch (error) {
    console.error(
      "❌ Error sending Telegram message:",
      error.response?.data || error.message
    );
  }
};

/**
 * ✅ Function to create a ticket in Gorgias
 */
const createGorgiasTicket = async (messageText, userName) => {
  const AUTH_HEADER = `Basic ${Buffer.from(
    `${GORGIAS_EMAIL}:${GORGIAS_API_KEY}`
  ).toString("base64")}`;

  try {
    const response = await axios.post(
      `https://${GORGIAS_DOMAIN}/api/tickets`,
      {
        trashed_datetime: null,
        channel: "email",
        is_unread: false,
        priority: "normal",
        custom_fields: [],
        reply_options: {
          email: { answerable: true },
          "internal-note": { answerable: true },
        },
        spam: false,
        subject: "New Ticket from Telegram",
        messages: [
          {
            channel: "email",
            mention_ids: [],
            macros: [],
            body_html: "<div>Test Ticket</div>",
            public: true,
            body_text: messageText,
            subject: "",
            via: "helpdesk",
            from_agent: true,
            attachments: [],
            sender: {
              email: "maymyatmon.dev@gmail.com",
              id: 17938535,
              name: userName,
            },
            source: {
              type: "email",
              from: {
                name: "May Myat Mon",
                address: "maymyatmon.dev@gmail.com",
              },
              extra: { include_thread: false },
              to: [
                {
                  name: "May Myat Mon",
                  address: "maymyatmon.dev@gmail.com",
                },
              ],
            },
          },
        ],
        assignee_team: null,
        via: "helpdesk",
        status: "open",
        tags: [],
        events: [],
        assignee_user: null,
      },
      {
        headers: {
          Authorization: AUTH_HEADER,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Ticket Created in Gorgias:", response.data);
  } catch (error) {
    console.error(
      "❌ Error sending to Gorgias:",
      error.response?.data || error.message
    );
  }
};

/**
 * ✅ Start the Express server
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
