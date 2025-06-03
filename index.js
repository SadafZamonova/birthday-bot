require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const app = express();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const birthdays = require('./birthdays.json');

function checkBirthdays() {
  const today = dayjs().utc().startOf('day');
  const thisYear = today.year();

  birthdays.forEach(({ name, date }) => {
    const birthdayThisYear = dayjs(`${thisYear}-${date}`);
    const diff = birthdayThisYear.diff(today, 'day');

    if (diff === 2) {
      bot.sendMessage(process.env.CHAT_ID, `📅 Через 2 дня день рождения у ${name}!`);
    } else if (diff === 0) {
      bot.sendMessage(process.env.CHAT_ID, `🎉 Поздравляем с днём рождения, ${name}!`);
    }
  });
}

cron.schedule('35 14 * * *', () => {
  console.log('⏰ Запуск автоматической проверки в 14:35...');
  checkBirthdays();
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Я бот для напоминания о днях рождения.');
});

