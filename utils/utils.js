const fs = require("fs/promises");
const path = require("path");

const registrosPath = path.join(
  __dirname,
  "..",
  process.env.CARPETA,
  process.env.NOMBRE_ARCHIVO,
);

function obtenerRuc(msg) {
  const ruc = msg.body.match(/\b20\d{9}\b/);
  if (ruc) {
    return ruc[0];
  }
  return null;
}

function contruirMensaje(data) {
  const {
    preevaluacion_crediticia: preevaluacion,
    estado_aprobacion: estado,
    planes_datos: planes,
    equipos_accesorios: equipos,
  } = data;

  // Estado
  const texto_estado = `*Estado*: ${estado ? "✅ Aprobado" : "❌ Desaprobado"}\n\n`;

  // Preevaluación
  const texto_preevaluacion =
    preevaluacion !== "Aprobado" ? `Motivo: ${preevaluacion}\n\n` : "";

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
    `✔️ Monto disponible para financiar equipos y accesorios: *S/${equipos.monto_disponible_financiamiento}*`,
  ].join("\n");
  return texto_estado + texto_preevaluacion + texto_planes;
}
async function escribirRegistros(registros) {
  await fs.mkdir(path.dirname(registrosPath), { recursive: true });
  await fs.writeFile(registrosPath, JSON.stringify(registros, null, 2));
}
async function guardarMensaje(mensaje) {
  const registros = await leerRegistros();

  const index = registros.findIndex((registro) => registro.id === mensaje.id);
  if (index >= 0) {
    registros[index] = { ...registros[index], ...mensaje };
  } else {
    registros.push(mensaje);
  }

  await escribirRegistros(registros);
}

async function leerRegistros() {
  try {
    const contenido = await fs.readFile(registrosPath, "utf8");
    const registros = JSON.parse(contenido);
    return Array.isArray(registros) ? registros : [];
  } catch (error) {
    if (error.code === "ENOENT" || error.name === "SyntaxError") {
      return [];
    }

    throw error;
  }
}

module.exports = {
  contruirMensaje,
  obtenerRuc,
  escribirRegistros,
  guardarMensaje,
  leerRegistros,
};
