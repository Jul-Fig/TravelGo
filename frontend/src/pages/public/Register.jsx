import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { bookingStorage } from "../../utils/bookingStorage";
import { API } from '../../config/api';

export default function Register() {
  const [form, setForm] = useState({
    primerNombre: "",
    primerApellido: "",
    telefono: "",
    nacionalidad: "",
    fecha_nacimiento: "",
    genero: "",
    correo: "",
    contrasena: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [bookingSummary, setBookingSummary] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  

  useEffect(() => {
    const pending = bookingStorage.hasPendingBooking();
    setHasPendingBooking(pending);
    if (pending) setBookingSummary(bookingStorage.getSummary());
    if (location.state?.from === 'booking') setFromBooking(true);
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

   

    try {
      // Validar campos requeridos
      if (!form.primerNombre || !form.primerApellido || !form.correo || !form.contrasena) {
        setError("Por favor completa todos los campos obligatorios");
        return;
      }

      // 1. Registrar usuario
       const response = await fetch(API.usuarios, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al registrar usuario");
      }

      // 2. Hacer login automático
      const loginResponse = await fetch(`${API.auth}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: form.correo.trim(), contrasena: form.contrasena }),
      });

      if (!loginResponse.ok) {
        navigate('/login', { state: { from: 'booking' }, replace: true });
        return;
      }

      const loginData = await loginResponse.json();

      // 3. Guardar datos de sesión
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("usuarioId", loginData.usuarioId);
      localStorage.setItem("correo", loginData.correo);
      localStorage.setItem("primerNombre", loginData.primerNombre);
      localStorage.setItem("primerApellido", loginData.primerApellido);
      localStorage.setItem("tipoUsuario", loginData.tipoUsuario);

      
      await new Promise(resolve => setTimeout(resolve, 100));

      if (bookingStorage.hasPendingBooking() || fromBooking) {
        navigate('/booking', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('❌ Error en el registro:', err.message);
      setError(err.message || 'Error al registrar el usuario. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#391e37] to-[#b97cb9] font-sans antialiased min-h-screen flex items-center justify-center px-4 py-8">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#361c34]">
            <span className="text-[#b97cb9]">Travel</span> Go
          </h1>
        </div>
 
        {hasPendingBooking && bookingSummary && (
          <div className="w-full max-w-md mb-4 bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Tienes una reserva en progreso</p>
                <p className="text-xs text-blue-600 mt-1">
                  {bookingSummary.origin} → {bookingSummary.destination}
                </p>
              </div>
            </div>
          </div>
        )}
 
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 md:p-10">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
            {hasPendingBooking ? 'Crea tu cuenta y continúa' : 'Regístrate en TravelGo'}
          </h1>
 
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}
 
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: 'primerNombre',    label: 'Primer Nombre *',         type: 'text' },
              { id: 'primerApellido',  label: 'Primer Apellido *',        type: 'text' },
              { id: 'telefono',        label: 'Teléfono *',               type: 'tel' },
              { id: 'fecha_nacimiento',label: 'Fecha de nacimiento *',    type: 'date' },
              { id: 'correo',          label: 'Correo electrónico *',     type: 'email' },
            ].map(({ id, label, type }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
                <input
                  type={type} id={id} name={id} required
                  value={form[id]} onChange={handleChange}
                  className="form-input w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cosmic-base"
                />
              </div>
            ))}
 
            {/* Contraseña */}
            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium mb-1 text-gray-700">Contraseña *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} id="contrasena" name="contrasena"
                  required value={form.contrasena} onChange={handleChange} placeholder="••••••••"
                  className="form-input w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cosmic-base pr-10"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-2 text-gray-600 hover:text-gray-800">
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
 
            {/* Nacionalidad */}
            <div>
              <label htmlFor="nacionalidad" className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad *</label>
              <select id="nacionalidad" name="nacionalidad" value={form.nacionalidad} onChange={handleChange} required
                className="form-input w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cosmic-base">
                <option value="">Seleccione una opción</option>
                <option value="Colombia">Colombia</option>
                <option value="Mexico">México</option>
                <option value="Argentina">Argentina</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Peru">Perú</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Chile">Chile</option>
                <option value="Paraguay">Paraguay</option>
                <option value="Uruguay">Uruguay</option>
                <option value="Panama">Panamá</option>
                <option value="Costa_rica">Costa Rica</option>
                <option value="Nicaragua">Nicaragua</option>
                <option value="Honduras">Honduras</option>
                <option value="Guatemala">Guatemala</option>
              </select>
            </div>
 
            {/* Género */}
            <div>
              <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
              <select id="genero" name="genero" value={form.genero} onChange={handleChange} required
                className="form-input w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cosmic-base">
                <option value="">Seleccione una opción</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
                <option value="UNSPECIFIED">Otro</option>
              </select>
            </div>
 
            <div className="flex flex-col space-y-3 pt-2">
              <button type="submit" disabled={loading}
                className="w-full bg-[#8a4c85] text-white py-2.5 px-4 rounded-lg font-medium hover:bg-[#391e37] shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {hasPendingBooking ? 'Creando cuenta...' : 'Registrando...'}
                  </span>
                ) : (
                  hasPendingBooking ? 'Registrarse y continuar reserva' : 'Registrarse'
                )}
              </button>
              <button type="button"
                onClick={() => {
                  if (hasPendingBooking && !window.confirm('¿Estás seguro? Tu reserva se guardará 30 minutos.')) return;
                  navigate('/');
                }}
                className="w-full text-center bg-gray-100 text-gray-800 py-2.5 px-4 rounded-lg font-medium hover:bg-[#a35f9f] hover:text-white transition-colors">
                Volver al inicio
              </button>
            </div>
          </form>
 
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" state={{ from: fromBooking ? 'booking' : null }}
                className="text-cosmic-base font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}