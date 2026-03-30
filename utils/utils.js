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

module.exports = {
  contruirMensaje,
  obtenerRuc,
};
