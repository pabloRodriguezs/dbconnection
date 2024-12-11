import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "miBaseDeDatos";

async function conectar() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");
    const db = client.db(dbName);
    const coleccion = db.collection("miColeccion");
    const resultado = await coleccion.insertOne({ nombre: "Prueba", edad: 25 });
    console.log("Documento insertado:", resultado);
  } catch (err) {
    console.error("Error al conectar con MongoDB:", err);
  } finally {
    await client.close();
  }
}

conectar();
