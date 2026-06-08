const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');

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

async function getCapa(nomeJornal) {
  const data = getDataHoje();
  const url = `https://cdn.capasdehoje.pt/capas/${data}/capa-${nomeJornal}-large.webp`;
  try {
    const response = await axios.head(url);
    if (response.status === 200) return url;
    return null;
  } catch (e) {
    return null;
  }
}

async function publicarCapas() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  const jornais = [
    { key: 'a-bola', nome: 'A Bola', cor: 0xFF0000 },
    { key: 'record', nome: 'Record', cor: 0x006400 },
    { key: 'o-jogo', nome: 'O Jogo', cor: 0xFF8C00 }
  ];

  await channel.send('📰 **Capas Desportivas de hoje!**');

  for (const jornal of jornais) {
    const capaUrl = await getCapa(jornal.key);
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
