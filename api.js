const axios = require("axios");
const urlBase = process.env.URL_BASE;

const api = axios.create({
  baseURL: urlBase,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNREFUSED") {
      console.log("Servidor no disponible");
      error.message = "Servidor no disponible";
    }
    return Promise.reject(error);
  },
);

module.exports = api;
