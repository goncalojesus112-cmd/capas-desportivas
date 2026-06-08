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
  return { ano, mes, dia };
}

async function getCapa(jornal) {
  const { ano, mes, dia } = getDataHoje();

  // EPD (Estante Digital) tem as capas dos jornais portugueses
  const urls = {
    'abola':  `https://www.newsstand.pt/jornais/a-bola`,
    'record': `https://www.newsstand.pt/jornais/record`,
    'ojogo':  `https://www.newsstand.pt/jornais/o-jogo`
  };

  // Alternativa: usar a API pública do paperboy/kiosko com o formato de URL direto
  const kioskoDireto = {
    'abola':  `https://img.kiosko.net/${ano}/${mes}/${dia}/pt/abola.750.jpg`,
    'record': `https://img.kiosko.net/${ano}/${mes}/${dia}/pt/record.750.jpg`,
    'ojogo':  `https://img.kiosko.net/${ano}/${mes}/${dia}/pt/ojogo.750.jpg`
  };

  try {
    const url = kioskoDireto[jornal];
    // Verifica se a imagem existe
    const response = await axios.head(url);
    if (response.status === 200) return url;
    return null;
  } catch (e) {
    // Tenta o dia anterior se a de hoje ainda não estiver disponível
    try {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      const a = ontem.getFullYear();
      const m = String(ontem.getMonth() + 1).padStart(2, '0');
      const d = String(ontem.getDate()).padStart(2, '0');
      const urlOntem = `https://img.kiosko.net/${a}/${m}/${d}/pt/${jornal === 'abola' ? 'abola' : jornal === 'record' ? 'record' : 'ojogo'}.750.jpg`;
      const r2 = await axios.head(urlOntem);
      if (r2.status === 200) return urlOntem;
    } catch (e2) {}
    return null;
  }
}

async function publicarCapas() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  const jornais = [
    { key: 'abola', nome: 'A Bola', cor: 0xFF0000 },
    { key: 'record', nome: 'Record', cor: 0x006400 },
    { key: 'ojogo',  nome: 'O Jogo', cor: 0xFF8C00 }
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
      embed.setDescription('Capa não disponível hoje.');
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
