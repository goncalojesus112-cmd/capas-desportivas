const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const TOKEN = process.env.BOT_TOKEN;

function getDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// A Bola e Record via capasdehoje.pt (CDN direto)
async function getCapaCDN(nomeJornal) {
  const data = getDataHoje();
  const url = `https://cdn.capasdehoje.pt/capas/${data}/capa-${nomeJornal}-large.webp`;
  try {
    const response = await axios.head(url, { timeout: 5000 });
    if (response.status === 200) return url;
    return null;
  } catch (e) {
    return null;
  }
}

// O Jogo via vercapas.com (scraping do og:image)
async function getCapaOJogo() {
  try {
    const { data } = await axios.get('https://www.vercapas.com/capa/o-jogo.html', {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36' }
    });
    const $ = cheerio.load(data);
    // Extrai a imagem grande diretamente do og:image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && ogImage.includes('covers')) {
      // Converte o URL da thumbnail para a imagem grande
      return ogImage.replace('/thumbc/', '/covers/').replace('thumbc', 'covers');
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function publicarCapas() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  await channel.send('📰 **Capas Desportivas de hoje!**');

  const jornais = [
    { nome: 'A Bola', cor: 0xFF0000, fn: () => getCapaCDN('a-bola') },
    { nome: 'Record', cor: 0x006400, fn: () => getCapaCDN('record') },
    { nome: 'O Jogo',  cor: 0xFF8C00, fn: () => getCapaOJogo() }
  ];

  for (const jornal of jornais) {
    const capaUrl = await jornal.fn();
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
  cron.schedule('0 7 * * *', publicarCapas, { timezone: 'Europe/Lisbon' });

  // TESTE: publica imediatamente
  await publicarCapas();
});

client.login(TOKEN);
