const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
require("dotenv").config();
const axios = require("axios");

const cliente = new Client({
  authStrategy: new LocalAuth({
    clientId: "ConsultaSuelta",
  }),
  puppeteer: { headless: true },
});

cliente.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

cliente.on("ready", async () => {
  console.log("Bienvenido");
  //   const chats = await cliente.getChats();
  //   chats.forEach((chat) => {
  //     if (chat) {
  //       console.log(chat.name, chat.id._serialized);
  //     }
  //   });

  //   console.log("mi id", cliente.info.me._serialized);
});

cliente.on("message", (msg) => {
  if (msg.from == process.env.PRUEBA || msg.from == process.env.PERSONAL) {
    procesarMensaje(msg);
  }
});

async function procesarMensaje(msg) {
  try {
    console.log(msg.body);

    const res = await axios.post("http://0.0.0.0:8000/consulasuelta/", {
      ruc: msg.body,
    });
    if (Object.keys(res.data).length === 0) {
      await cliente.sendMessage(process.env.PERSONAL, "ACTUALIZA EL TOKEN");
    } else {
      await msg.reply(JSON.stringify(res.data));
    }
  } catch (error) {
    console.log(error);
  }
}

cliente.initialize();
