import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import express from 'express';


dotenv.config();

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})



const bot = new Telegraf(process.env.TELEGRAM_API);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
const commands = `
1. /start - Greet the user and provide a welcome note.\n
2. /menu - Show today's menu for all meals (breakfast, lunch, snacks, dinner).\n
3. /instructions - Display a list of available commands and their descriptions.\n
4. /help - Contact @Jsakshxm for any help or queries.\n
5. /about - Provides information about the bot.\n
6. /nextdaybf - Provides the breakfast menu for the next day.\n
`;


const WELCOME_NOTE = "Welcome to NIT GOA Mess Menu Bot";
const STICKER = "CAACAgUAAxkBAAMYZrJzHHJhg-3skPgTrAo2at2ZKoMAAlAEAAKzhjMl8tGt-kZ-cDs1BA";

bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  await ctx.reply(`Hello ${from.first_name}!`);
  await ctx.reply(WELCOME_NOTE);

  const lastName = from.last_name || 'No last name';
  const username = from.username || 'No username';
  const isBot = from.is_bot || false;
  const tgId = from.id;
  const firstName = from.first_name || 'No first name';

  try {
    const { data, error } = await supabase
      .from('MenuUsers')
      .insert([{
        FirstName: firstName,
        LastName: lastName,
        username: username,
        isBot: isBot,
        tgId: tgId
      }])
      .select('*');

    if (error) {
      throw error;
    }

    console.log('User inserted:', data);
  } catch (error) {
    console.error(error);
    await ctx.reply('Something went wrong');
  }
});

bot.command('menu', async (ctx) => {
    const today = new Date().toLocaleString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('day', today);
  
    if (error) {
      return ctx.reply('Error fetching menu');
    }
  
    if (data.length === 0) {
      return ctx.reply('No menu available for today');
    }
  
    let response = `Menu for ${today}:\n`;
    data.forEach((entry) => {
      response += `${entry.meal_type}:\n`;
      const itemsArray = Array.isArray(entry.items) ? entry.items : entry.items.split(',');
      itemsArray.forEach(item => response += `- ${item}\n`);
      response += '\n';
    });
  
    ctx.reply(response);
  });

  bot.command('nextdaybf', async (ctx) => {
    // Calculate the next day
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayName = nextDay.toLocaleString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  
    // Fetch breakfast menu for the next day
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('day', nextDayName)
      .eq('meal_type', 'Breakfast');
  
    if (error) {
      return ctx.reply('Error fetching next day\'s breakfast menu');
    }
  
    if (data.length === 0) {
      return ctx.reply('No breakfast menu available for the next day');
    }
  
    // Debugging: Log the fetched data to check its structure
    console.log('Fetched Data:', data);
  
    let response = `Breakfast menu for ${nextDayName}:\n`;
    
    data.forEach((entry) => {
      console.log('Entry:', entry); // Log each entry
      if (Array.isArray(entry.items)) { // Check if `items` is an array
        entry.items.forEach(item => response += `- ${item}\n`);
      } else {
        response += `- ${entry.items}\n`; // Handle cases where `items` is not an array
      }
      response += '\n';
    });
  
    ctx.reply(response);
  });

  bot.command("instructions",async(ctx)=>{await ctx.reply(commands);})
  
  

bot.command('about', async (ctx) => {
  ctx.reply("The NIT GOA Mess Menu Bot provides daily mess menu details and next day's breakfast info");
});

bot.command('help', async (ctx) => {   
  ctx.reply("Please contact @Jsakshxm for any help or queries.");
});

bot.on('text', async (ctx) => {
    await ctx.reply('PLEASE SEND ME A VALID COMMAND');
  
    // Send a sticker and save the message ID
    const stickerMessage = await ctx.replyWithSticker(STICKER);
  
    // Function to sleep for the given time
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  

    await sleep(2000);
    await ctx.deleteMessage(stickerMessage.message_id);
  });

bot.launch()
  .then(() => console.log('Bot started successfully'))
  .catch(err => console.error('Error starting bot', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
