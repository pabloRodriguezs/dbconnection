export default function extractBookingData(text) {
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
