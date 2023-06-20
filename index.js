const TelegramApi = require('node-telegram-bot-api')
const token = '6244574892:AAERTiaQsqs8zPdkd95Q45v_nADqZ_1q2IM'
const {gameOptions, againOptions} = require('./options')
const fs = require("fs");
const axios = require("axios");

const bot = new TelegramApi(token, {polling: true})
const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, 'Сейчас я загадаю цифру от 0 до 9, а ты попробуй её угадать :)')
    const randomNumber = Math.floor(Math.random() * 10)
    chats[chatId] = randomNumber
    await bot.sendMessage(chatId, 'Отгадай', gameOptions)
}

const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/info', description: 'Информация о пользователе'},
        {command: '/game', description: 'Игра: "Угадай цифру"'},
        {command: '/scan', description: 'Отсканируй файл'}
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        const name = msg.from.first_name;
        const surname = msg.from.last_name;

        if (text === '/start'){
            await bot.sendSticker(chatId, 'https://chpic.su/_data/stickers/s/shiba_supra/shiba_supra_004.webp?v=1687246501')
            return bot.sendMessage(chatId, `Добро пожаловать, ${name}`)
        }
        if (text === '/info') {
            return bot.sendMessage(chatId, `Пользователь ${name} ${surname}. Ты написал мне - "${text}"`)
        }
        if (text === '/game') {
            return startGame(chatId)
        }
        if (text === '/scan') {
            return bot.sendMessage(chatId, 'Пришлите мне изображение с текстом')
        }
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/again') {
            return startGame(chatId)
        }

        if (parseInt(data) === chats[chatId]) {
            return await bot.sendMessage(chatId, `Поздравляю! Ты отгадал цифру ${chats[chatId]} которую загадал бот.`, againOptions)
        } else {
            return await bot.sendMessage(chatId, `Ты выбрал цифру ${data}, к сожалению ты не угадал, бот загадал другую цифру (${chats[chatId]}).`, againOptions)
        }
    })
    bot.on('photo', async msg => {
        const chatId = msg.chat.id;
        const photo = msg.photo[msg.photo.length - 1];
        const file = await bot.getFile(photo.file_id);
        const filePath = file.file_path;
        const url = `https://api.telegram.org/file/bot${token}/${filePath}`;

        // Здесь сохраняем файл на диск
        const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageResponse.data, 'binary');
        fs.writeFileSync('image.jpg', buffer);

        // Здесь распознаем текст с помощью tesseract.js
        const { createWorker } = require('tesseract.js');
        const worker = await createWorker();

        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize('image.jpg');
        await worker.terminate();

        const wordCount = text.trim().split(/\s+/).length;
        const charCount = text.replace(/\s/g, '').length;
        const languageCode = msg.from.language_code;

        return bot.sendMessage(chatId, `Количество символов с пробелами: ${charCount}, количество слов: ${wordCount}. Язык текста: ${languageCode}`);
    });
}

start()