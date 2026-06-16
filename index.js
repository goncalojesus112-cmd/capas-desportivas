const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const TOKEN = process.env.BOT_TOKEN;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'
};

// Vai buscar o og:image da página — funciona para qualquer jornal
async function getCapaFromPage(pageUrl) {
  try {
    const { data } = await axios.get(pageUrl, { timeout: 10000, headers: HEADERS });
    const $ = cheerio.load(data);
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && ogImage.startsWith('http')) return ogImage;
    return null;
  } catch (e) {
    return null;
  }
}

async function publicarCapas() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  const jornais = [
    {
      nome: 'A Bola',
      cor: 0xFF0000,
      url: 'https://capasjornais.pt/Capa-Jornal-A-Bola.html'
    },
    {
      nome: 'Record',
      cor: 0x006400,
      url: 'https://capasjornais.pt/Capa-Jornal-Record.html'
    },
    {
      nome: 'O Jogo',
      cor: 0xFF8C00,
      url: 'https://capasjornais.pt/Capa-Jornal-O-Jogo.html'
    }
  ];

  await channel.send('📰 **Capas Desportivas de hoje!**');

  for (const jornal of jornais) {
    const capaUrl = await getCapaFromPage(jornal.url);
    const embed = new EmbedBuilder()
      .setTitle(`📰 ${jornal.nome}`)
      .setColor(jornal.cor)
      .setTimestamp();
    if (capaUrl) {
      embed.setImage(capaUrl);
    } else {
      embed.setDescription('Capa ainda não disponível. Tenta mais tarde.');
    }
    await channel.send({ embeds: [embed] });
  }
}

client.once('ready', async () => {
  console.log(`Bot online: ${client.user.tag}`);
  cron.schedule('0 8 * * *', publicarCapas, { timezone: 'Europe/Lisbon' });

  // TESTE: publica imediatamente
  await publicarCapas();
});

client.login(TOKEN);
