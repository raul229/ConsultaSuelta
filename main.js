const {Client, LocalAuth} = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
require("dotenv").config();
const axios = require("axios");

const cliente = new Client({
    authStrategy: new LocalAuth({
        clientId: "ConsultaSuelta"
    }),
    puppeteer: {headless: true}
});

cliente.on("qr", qr=>{
    qrcode.generate(qr, {small: true});
});

cliente.on("ready", async ()=>{
    console.log("Bienvenido");
    // const chats = await cliente.getChats();
    // chats.forEach(chat => {
    //     if(chat.isGroup){
    //         console.log(chat.name, chat.id._serialized)
    //     }
    // })
});

cliente.on("message", msg=>{
    if(msg.from!== process.env.PRUEBA) return;
    procesarMsg(msg);
})

async function procesarMsg(msg) {
    try{
        
        const res = await axios.post("http://0.0.0.0:8000/consulasuelta/", {
            ruc: msg.body
        });
       
        await msg.reply(JSON.stringify(res.data));

       
    }
    catch(error){
        console.log(error);
    }
    
}

cliente.initialize();