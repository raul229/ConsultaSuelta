const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
require("dotenv").config();
const api = require("./api.js");
const {
  contruirMensaje,
  obtenerRuc,
  guardarMensaje,
  leerRegistros,
  escribirRegistros,
} = require("./utils/utils.js");

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

cliente.on("disconnected", (reason) => {
  console.log("Desconectado:", reason);
});

cliente.on("ready", async () => {
  console.log("Bienvenido");
  await procesarMensajesPendientes();
});

const numeroPersonal = process.env.PERSONAL;
const grupo = process.env.PRUEBA;

cliente.on("message", (msg) => {
  if (msg.from === numeroPersonal) {
    if (msg.body.toUpperCase() === "ACTUALIZAR") {
      cargarToken();
      procesarMensajesPendientes();
    } else {
      recibirToken(msg);
    }
  }
  if (msg.from === grupo) {
    procesarMensaje(msg);
  }
});
async function recibirToken(msg) {
  try {
    const token = JSON.parse(msg.body);
    const res = await api.post("/token/", token);
    if (res.status === 200) {
      await cliente.sendMessage(numeroPersonal, "Token actualizado");
    } else {
      await cliente.sendMessage(numeroPersonal, "Error al actualizar el token");
    }
  } catch (error) {
    console.log("Formato json equivocado");
  }
}

async function procesarMensaje(msg) {
  const ruc = obtenerRuc(msg);
  const idMensaje = msg.id?._serialized || msg.id;
  if (!ruc) {
    return;
  }
  try {
    const res = await api.post("/consulasuelta/", {
      ruc,
    });
    // si la respuesta es igual a {} avisamos que falta token y esperamos que envie uno para cargarlo
    if (Object.keys(res.data).length === 0) {
      await cliente.sendMessage(numeroPersonal, "ACTUALIZA EL TOKEN");
      await guardarMensaje({
        ruc,
        id: idMensaje,
        respondido: false,
      });
    } else {
      const texto = contruirMensaje(res.data);
      // Respuesta final
      await msg.reply(texto);
    }
  } catch (error) {
    if (error.message) {
      await cliente.sendMessage(numeroPersonal, error.message);
      await guardarMensaje({
        ruc: ruc,
        id: idMensaje,
        respondido: false,
      });
    } else {
      console.log(error);
    }
  }
}

async function cargarToken() {
  const res = await api.get("/update/");
  if (res.status === 200) {
    await cliente.sendMessage(numeroPersonal, "Token actualizado");
  } else {
    await cliente.sendMessage(numeroPersonal, "Error al actualizar el token");
  }
}

async function procesarMensajesPendientes() {
  const registros = await leerRegistros();

  for (const registro of registros) {
    if (!registro?.id || !registro?.ruc || registro.respondido) {
      continue;
    }

    await procesarRegistroPendiente(registro);
  }
}

async function procesarRegistroPendiente(registro) {
  try {
    const res = await api.post("/consulasuelta/", {
      ruc: registro.ruc,
    });

    if (Object.keys(res.data).length === 0) {
      await cliente.sendMessage(numeroPersonal, "ACTUALIZA EL TOKEN");
      return;
    }

    const mensaje = await cliente.getMessageById(registro.id);
    if (!mensaje) {
      await marcarComoRespondidoYQuitar(registro.id);
      return;
    }

    const texto = contruirMensaje(res.data);
    await mensaje.reply(texto);
    await marcarComoRespondidoYQuitar(registro.id);
  } catch (error) {
    if (error.message) {
      await cliente.sendMessage(numeroPersonal, error.message);
    } else {
      console.log(error);
    }
  }
}

async function marcarComoRespondidoYQuitar(id) {
  const registros = await leerRegistros();
  const index = registros.findIndex((registro) => registro.id === id);

  if (index === -1) {
    return;
  }

  registros[index] = { ...registros[index], respondido: true };
  registros.splice(index, 1);
  await escribirRegistros(registros);
}

cliente.initialize();
