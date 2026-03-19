const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9090";

export const API = {
  flights: `${BASE_URL}/flights`,
  hotels: `${BASE_URL}/hotels`,

  auth: `${BASE_URL}/api/auth`,
  admin: `${BASE_URL}/api/admin`,
  usuarios: `${BASE_URL}/api/usuarios`,
  credenciales: `${BASE_URL}/api/credenciales`,
  viajes: `${BASE_URL}/api/viajes`,
  reservas: `${BASE_URL}/api/reservas`,
  bookings: `${BASE_URL}/api/bookings`,
  pago: `${BASE_URL}/api/pago`,
  transporte: `${BASE_URL}/api/transporte`,
  alojamientos: `${BASE_URL}/api/alojamientos`,
  administrador: `${BASE_URL}/api/administrador`,
};

export default API;
