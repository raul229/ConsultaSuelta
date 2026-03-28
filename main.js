const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
require("dotenv").config();
const axios = require("axios");

const cliente = new Client({
  authStrategy: new LocalAuth({
    clientId: "ConsultaSuelta",
  }),
  puppeteer: { 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
const grupo=process.env.PRUEBA

cliente.on("message", (msg) => {

  if (msg.from === numeroPersonal){
    recibirToken(msg);

  }
  if (msg.from === grupo) {
    procesarMensaje(msg);
  }
});
async function recibirToken(msg){
  try {
    const res=await axios.post("http://0.0.0.0:8000/token/", JSON.parse(msg.body))
    if (res.status === 200) {
      await cliente.sendMessage(numeroPersonal, "Token actualizado");
    } else {
      await cliente.sendMessage(numeroPersonal, "Error al actualizar el token");
    }
    
  } catch (error) {
    await cliente.sendMessage(numeroPersonal, "Error en el formato json, envia el token en formato json");
  }

}

async function procesarMensaje(msg) {
  try {
    const res = await axios.post("http://0.0.0.0:8000/consulasuelta/", {
      ruc: msg.body,
    });
    // si la respuesta es igual a {} avisamos que falta token y esperamos que envie uno para cargarlo
    if (Object.keys(res.data).length === 0) {
      await cliente.sendMessage(numeroPersonal, "ACTUALIZA EL TOKEN");

    } else {    
      const {
  preevaluacion_crediticia: preevaluacion,
  estado_aprobacion: estado,
  planes_datos: planes,
  equipos_accesorios: equipos
} = res.data;

// Estado
const texto_estado = `*Estado*: ${estado ? "✅ Aprobado" : "❌ Desaprobado"}\n\n`;

// Preevaluación
const texto_preevaluacion =
  preevaluacion !== "Aprobado"
    ? `Motivo: ${preevaluacion}\n\n`
    : "";

// Planes
const texto_planes = [
      "📶 *PLANES:*",
      "",
      `✔️ Monto maximo disponible para contratar servicios Moviles: *S/${planes.monto_maximo}*`,
      `✔️ Monto ocupado en servicios Méviles: *S/${planes.monto_ocupado}*`,
      `✔️ Monto disponible para contratar servicios Moviles: *S/${planes.monto_disponible}*`,
      "",
      "📲 *EQUIPOS:*",
      "",
      `✔️ Tipo de cliente: *${equipos.tipo_cliete}*`,
      `✔️ Cantidad de meses para cuotas de financiamiento: *${equipos.meses_financiamiento}*`,
      `✔️ Monto maximo para financiamiento: *S/${equipos.monto_maximo_financiamiento}*`,
      `✔️ Monto ocupado en financiamiento: *S/${equipos.monto_ocupado_financiamiento}*`,
      `✔️ Monto disponible para financiar equipos y accesorios: *S/${equipos.monto_disponible_financiamiento}*`
    ].join("\n");

    // Respuesta final
    await msg.reply(texto_estado + texto_preevaluacion + texto_planes);
     }
  } catch (error) {
    console.log(error);
  }
}

cliente.initialize();
