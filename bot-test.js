require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;

console.log('TELEGRAM_TOKEN:', token);

if (!token) {
  console.error('Ошибка: TELEGRAM_TOKEN не найден в переменных окружения!');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  console.log('Новое сообщение:', msg.text);
  bot.sendMessage(msg.chat.id, `Вы написали: ${msg.text}`);
});

console.log('Бот запущен и слушает сообщения...');