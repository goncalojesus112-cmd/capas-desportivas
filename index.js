const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const TOKEN = process.env.BOT_TOKEN;

async function getCapa(jornal) {
  const urls = {
    'abola': 'https://www.abola.pt',
    'record': 'https://www.record.pt',
    'ojogo': 'https://www.ojogo.pt'
  };
  // Usa kiosko.net como fonte fiável das capas
  const kioskUrls = {
    'abola': 'https://kiosko.net/pt/sp/abola.html',
    'record': 'https://kiosko.net/pt/sp/record.html',
    'ojogo': 'https://kiosko.net/pt/sp/ojogo.html'
  };
  try {
    const { data } = await axios.get(kioskUrls[jornal]);
    const $ = cheerio.load(data);
    const img = $('img.cover').attr('src') || $('img').first().attr('src');
    return img ? (img.startsWith('http') ? img : 'https://kiosko.net' + img) : null;
  } catch (e) {
    return null;
  }
}

async function publicarCapas() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  const jornais = [
    { key: 'abola', nome: 'A Bola', cor: 0xFF0000 },
    { key: 'record', nome: 'Record', cor: 0x006400 },
    { key: 'ojogo', nome: 'O Jogo', cor: 0xFF8C00 }
  ];

  await channel.send('📰 **Capas Desportivas de hoje!**');

  for (const jornal of jornais) {
    const capaUrl = await getCapa(jornal.key);
    const embed = new EmbedBuilder()
      .setTitle(`📰 ${jornal.nome}`)
      .setColor(jornal.cor)
      .setTimestamp();
    if (capaUrl) embed.setImage(capaUrl);
    else embed.setDescription('Capa não disponível hoje.');
    await channel.send({ embeds: [embed] });
  }
}

client.once('ready', async () => {
  console.log(`Bot online: ${client.user.tag}`);
  // Publica todos os dias às 07:00
  cron.schedule('0 7 * * *', publicarCapas, { timezone: 'Europe/Lisbon' });
  
  // TESTE: publica imediatamente ao arrancar
  await publicarCapas();
});
client.login(TOKEN);
