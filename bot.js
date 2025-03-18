require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const axios = require("axios");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  bot.sendPhoto(chatId, fs.createReadStream("./banner.webp"), {
    contentType: "image/webp",
    caption:
      "🌍 **Adventure Awaits!** ✈️🏝️\n\n“If you're planning to travel, book your flight with Flymya for a chance to win and make your trip even more exciting!”\n\nChoose an option below to begin your journey:",
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

console.log("Bot is running...");

// Handle button clicks
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const choice = query.data;

  if (choice === "flight") {
    bot.sendMessage(chatId, "✈️ Please choose your flight type:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌍 International", callback_data: "flight_international" }],
          [{ text: "🏡 Domestic", callback_data: "flight_domestic" }],
        ],
      },
    });
  }
  // Domestic Flight Options
  else if (choice === "flight_domestic") {
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
  }
  // International Flight Options
  else if (choice === "flight_international") {
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
  }
  // Handling Route Selection
  else if (choice.startsWith("route_")) {
    const routes = {
      route_rgn_mdl: "Yangon (RGN) → Mandalay (MDL)",
      route_rgn_npt: "Yangon (RGN) → Nay Pyi Taw (NPT)",
      route_rgn_nyt: "Yangon (RGN) → Nyaung U (NYT)",
      route_rgn_bkk: "Yangon (RGN) → Bangkok (BKK)",
      route_rgn_sin: "Yangon (RGN) → Singapore (SIN)",
      route_rgn_icn: "Yangon (RGN) → Incheon (ICN)",
    };

    const selectedRoute = routes[choice];
    bot.sendMessage(
      chatId,
      `✅ You selected **${selectedRoute}**!\n\nBook your flight now with Flymya ✈️.`
    );
  } else if (choice === "bus") {
    bot.sendMessage(chatId, "You chose Bus services!");
  } else if (choice === "hotel") {
    bot.sendMessage(chatId, "You chose Hotel booking!");
  } else if (choice === "tour") {
    bot.sendMessage(chatId, "You chose Tour Packages!");
  }
});
