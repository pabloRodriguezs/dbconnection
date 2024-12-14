import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "miBaseDeDatos";

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]; // Permisos para leer correos
const TOKEN_PATH = "token.json"; // Archivo donde se guarda el token de acceso

async function postBooking(data) {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");
    const db = client.db(dbName);
    const coleccion = db.collection("miColeccion");
    const resultado = await coleccion.insertOne(data);
    console.log("Documento insertado:", resultado);
  } catch (err) {
    console.error("Error al conectar con MongoDB:", err);
  } finally {
    await client.close();
  }
}

// Cargar las credenciales desde el archivo JSON
const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Obtener el token de acceso
function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Autoriza esta URL:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Introduce el código de autorización: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error("Error al obtener el token de acceso", err);
        return;
      }
      oAuth2Client.setCredentials(token);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log("Token guardado en", TOKEN_PATH);
      listarCorreos(oAuth2Client);
    });
  });
}

// Listar correos desde la API de Gmail
async function listarCorreos(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  // Obtener correos no leídos
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
  });

  const messages = res.data.messages || [];
  console.log(`Se encontraron ${messages.length} correos.`);

  for (const message of messages) {
    const email = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
    });
    const body = email.data.snippet;
    const formatedEmail = extractBookingData(body);
    postBooking(formatedEmail);

    // Opcional: Marca el correo como leído
    // await gmail.users.messages.modify({
    //   userId: "me",
    //   id: message.id,
    //   resource: { removeLabelIds: ["UNREAD"] },
    // });
  }
}

// Cargar token existente o pedir autorización
if (fs.existsSync(TOKEN_PATH)) {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth2Client.setCredentials(token);
  listarCorreos(oAuth2Client);
} else {
  getAccessToken(oAuth2Client);
}

function extractBookingData(text) {
  const data = {};

  // Extract "Nombre y apellidos"
  const nameMatch = text.match(/Nombre y apellidos: ([\w\s]+)/i);
  data.name = nameMatch ? nameMatch[1].trim() : null;

  // Extract "Número de reserva"
  const reservationNumberMatch = text.match(/Número de reserva: ([\w\d]+)/i);
  data.reservationNumber = reservationNumberMatch
    ? reservationNumberMatch[1].trim()
    : null;

  // Extract "Teléfono móvil"
  const phoneMatch = text.match(/Teléfono móvil: (\+?\d[\d\s]+)/i);
  data.phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, "").trim() : null;

  // Extract "Número de matrícula"
  const licensePlateMatch = text.match(/Número de matrícula: ([\w\d]+)/i);
  data.licensePlate = licensePlateMatch ? licensePlateMatch[1].trim() : null;

  return data;
}
