require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GORGIAS_API_URL = `https://${process.env.GORGIAS_DOMAIN}/api/tickets`;
const GORGIAS_EMAIL = process.env.GORGIAS_EMAIL;
const GORGIAS_API_KEY = process.env.GORGIAS_API_KEY;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
app.use(bodyParser.json());

// Routes & Options Data
const routes = {
  route_rgn_mdl: "Yangon (RGN) → Mandalay (MDL)",
  route_rgn_npt: "Yangon (RGN) → Nay Pyi Taw (NPT)",
  route_rgn_nyt: "Yangon (RGN) → Nyaung U (NYT)",
  route_rgn_bkk: "Yangon (RGN) → Bangkok (BKK)",
  route_rgn_sin: "Yangon (RGN) → Singapore (SIN)",
  route_rgn_icn: "Yangon (RGN) → Incheon (ICN)",
};

// Webhook Endpoint
app.post("/webhook", async (req, res) => {
  const message = req.body.message;
  if (message && message.text) {
    const chatId = message.chat.id;
    const userMessage = message.text;

    // Create Ticket in Gorgias
    await createGorgiasTicket(chatId, userMessage);

    // Reply to Telegram user
    bot.sendMessage(chatId, "✅ Your message has been received!");
  }
  res.sendStatus(200);
});

// Handle User Messages & Buttons
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  bot.sendPhoto(chatId, fs.createReadStream("./banner.webp"), {
    contentType: "image/webp",
    caption:
      "🌍 **Adventure Awaits!** ✈️🏝️\n\n“Plan your travel and book now with Flymya for a chance to win!”\n\nChoose an option below to begin:",
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✈️ Flight", callback_data: "flight" }],
        [{ text: "🚌 Bus", callback_data: "bus" }],
        [{ text: "🏨 Hotel", callback_data: "hotel" }],
        [{ text: "🎫 Tour Packages", callback_data: "tour" }],
      ],
    },
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const choice = query.data;
  const userName = query.message.chat.username || "Unknown User";

  if (choice === "flight") {
    bot.sendMessage(chatId, "✈️ Please choose your flight type:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌍 International", callback_data: "flight_international" }],
          [{ text: "🏡 Domestic", callback_data: "flight_domestic" }],
        ],
      },
    });
  } else if (choice === "flight_domestic") {
    bot.sendMessage(chatId, "🏡 Choose a **Domestic Flight Route**:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Yangon (RGN) → Mandalay (MDL)",
              callback_data: "route_rgn_mdl",
            },
          ],
          [
            {
              text: "Yangon (RGN) → Nay Pyi Taw (NPT)",
              callback_data: "route_rgn_npt",
            },
          ],
          [
            {
              text: "Yangon (RGN) → Nyaung U (NYT)",
              callback_data: "route_rgn_nyt",
            },
          ],
        ],
      },
    });
  } else if (choice === "flight_international") {
    bot.sendMessage(chatId, "🌍 Choose an **International Flight Route**:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Yangon (RGN) → Bangkok (BKK)",
              callback_data: "route_rgn_bkk",
            },
          ],
          [
            {
              text: "Yangon (RGN) → Singapore (SIN)",
              callback_data: "route_rgn_sin",
            },
          ],
          [
            {
              text: "Yangon (RGN) → Incheon (ICN)",
              callback_data: "route_rgn_icn",
            },
          ],
        ],
      },
    });
  } else if (choice.startsWith("route_")) {
    const selectedRoute = routes[choice];
    bot.sendMessage(
      chatId,
      `✅ You selected **${selectedRoute}**!\n\nBook your flight now with Flymya ✈️.`
    );
    await createGorgiasTicket(
      chatId,
      `New Flight Inquiry **
      User Selection: ${selectedRoute},
      Customer Name: ${query.message.chat.first_name} (@${query.message.chat.username})`,
      userName
    );
    // Respond to Telegram
    await sendTelegramMessage(
      chatId,
      "✅ Your message has been received! Thank you for choosing Flymya. ✈️🌍"
    );
  } else {
    bot.sendMessage(chatId, `You chose ${choice}!`);
  }
});

// Function to Create a Ticket in Gorgias
async function createGorgiasTicket(chatId, messageText, userName) {
  const AUTH_HEADER = `Basic ${Buffer.from(
    `${GORGIAS_EMAIL}:${GORGIAS_API_KEY}`
  ).toString("base64")}`;
  try {
    await axios.post(
      GORGIAS_API_URL,
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
        subject: `New Ticket from Telegram user - ${userName}`,
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
    // console.log("✅ Ticket Created in Gorgias:", response.data);
  } catch (error) {
    console.error(
      "❌ Error sending to Gorgias:",
      error.response?.data || error.message
    );
  }
}

//Function to send message back to Telegram
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
