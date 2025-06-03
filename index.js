const express = require('express');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');

const app = express();

const TOKEN = process.env.TELEGRAM_TOKEN; // положи сюда свой токен через env-переменную
const bot = new TelegramBot(TOKEN, { polling: true });

// HTTP-сервер (нужно, чтобы Render не ругался)
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Пример функции проверки дней рождения
function checkBirthdays() {
  console.log('Проверяем дни рождения...');
  // Твой код проверки и отправки сообщений
}

// Запускаем cron задачу каждый день в 11:00
cron.schedule('0 11 * * *', () => {
  console.log('⏰ Запуск автоматической проверки в 11:00...');
  checkBirthdays();
});

// Пример реакции на команды
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Я бот для напоминания о днях рождения.');
});

