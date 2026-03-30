const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
require("dotenv").config();
const axios = require("axios");
const { contruirMensaje, obtenerRuc } = require("./utils/utils.js");

const cliente = new Client({
  authStrategy: new LocalAuth({
    clientId: "ConsultaSuelta",
  }),
  puppeteer: {
    headless: true,
  },
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

const numeroPersonal = process.env.PERSONAL;
const grupo = process.env.PRUEBA;

cliente.on("message", (msg) => {
  if (msg.from === numeroPersonal) {
    recibirToken(msg);
  }
  if (msg.from === grupo) {
    procesarMensaje(msg);
  }
});
async function recibirToken(msg) {
  try {
    const token = JSON.parse(msg.body);
    const res = await axios.post("http://0.0.0.0:8000/token/", token);
    if (res.status === 200) {
      await cliente.sendMessage(numeroPersonal, "Token actualizado");
    } else {
      await cliente.sendMessage(numeroPersonal, "Error al actualizar el token");
    }
  } catch (error) {
    console.log(error);
    console.log("Formato json equivocado");
  }
}

async function procesarMensaje(msg) {
  try {
    const ruc = obtenerRuc(msg);
    if (!ruc) {
      return;
    }
    const res = await axios.post("http://0.0.0.0:8000/consulasuelta/", {
      ruc,
    });
    // si la respuesta es igual a {} avisamos que falta token y esperamos que envie uno para cargarlo
    if (Object.keys(res.data).length === 0) {
      await cliente.sendMessage(numeroPersonal, "ACTUALIZA EL TOKEN");
    } else {
      const texto = contruirMensaje(res.data);
      // Respuesta final
      await msg.reply(texto);
    }
  } catch (error) {
    console.log(error);
  }
}

cliente.initialize();
