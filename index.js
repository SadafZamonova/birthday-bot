
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const cron = require('node-cron');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// bot.on('message', (msg) => {
//     console.log("📥 Chat ID:", msg.chat.id);
//   });

const CHAT_ID = process.env.CHAT_ID; // Личный ID или ID группы



// Функция: проверка дней рождения
function checkBirthdays() {
  const today = new Date();
  const data = JSON.parse(fs.readFileSync('birthdays.json', 'utf8'));

  data.forEach((person) => {
    const [month, day] = person.date.split('-').map(Number);
    const birthday = new Date(today.getFullYear(), month - 1, day);

    const diffDays = Math.ceil((birthday - today) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      bot.sendMessage(CHAT_ID, `🎂 Скоро день рождения у ${person.name}! (${person.date})`);
    }
  });
}

// Команда вручную
bot.onText(/\/check/, (msg) => {
  checkBirthdays();
  bot.sendMessage(msg.chat.id, '✅ Проверка выполнена');
});

// 📅 Автоматическая проверка каждый день в 11:00
cron.schedule('0 11 * * *', () => {
    console.log("⏰ Запуск автоматической проверки в 11:00...");
    checkBirthdays();
  });
