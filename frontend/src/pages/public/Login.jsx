import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { bookingStorage } from '../../utils/bookingStorage';
import { API } from '../../config/api';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [fromBooking, setFromBooking] = useState(false);

  useEffect(() => {
    const pending = bookingStorage.hasPendingBooking();
    setHasPendingBooking(pending);
    if (pending) setBookingSummary(bookingStorage.getSummary());
    if (location.state?.from === 'booking') setFromBooking(true);

    const correoGuardado = localStorage.getItem('correoGuardado');
    if (correoGuardado) { setCorreo(correoGuardado); setRemember(true); }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!correo || !contrasena) {
        setError('Por favor completa todos los campos');
        return;
      }

      // CORREGIDO: usa API.auth en lugar de URL hardcodeada
      const response = await fetch(`${API.auth}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim(), contrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuarioId', data.usuarioId);
      localStorage.setItem('correo', data.correo);
      localStorage.setItem('primerNombre', data.primerNombre);
      localStorage.setItem('primerApellido', data.primerApellido);
      localStorage.setItem('tipoUsuario', data.tipoUsuario);

      if (remember) {
        localStorage.setItem('correoGuardado', correo);
      } else {
        localStorage.removeItem('correoGuardado');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const hasBooking = bookingStorage.hasPendingBooking();
      if (hasBooking || fromBooking) {
        navigate('/booking', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#391e37] to-[#b97cb9]">
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
                  {bookingSummary.hasFlight && ' | Vuelo seleccionado'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 md:p-10">
          <h2 className="text-2xl font-bold text-center text-[#361c34] mb-8">
            {hasPendingBooking ? 'Continúa tu reserva' : 'Inicia sesión en Travel Go'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b97cb9] focus:outline-none focus:ring-2 focus:ring-[#b97cb9]"
                placeholder="tucorreo@ejemplo.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#b97cb9] focus:outline-none focus:ring-2 focus:ring-[#b97cb9] pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-800"
                >
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

            <div className="flex items-center justify-between mb-6">
              <label className="relative flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="peer hidden"
                />
                <span className="w-5 h-5 mr-2 border border-gray-300 rounded bg-white peer-checked:bg-[#b97cb9] peer-checked:border-[#b97cb9] flex items-center justify-center">
                  {remember && <span className="text-white text-xs">✓</span>}
                </span>
                <span className="text-sm text-gray-700">Recuérdame</span>
              </label>
              <Link to="/recuperar-contrasena" className="text-sm text-[#5b8bd6] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8a4c85] hover:bg-[#391e37] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                hasPendingBooking ? 'Iniciar sesión y continuar reserva' : 'Iniciar sesión'
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                ¿No tienes cuenta?
                <Link
                  to="/register"
                  state={{ from: fromBooking ? 'booking' : null }}
                  className="text-[#5b8bd6] font-medium hover:underline ml-1"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </form>

          <button
            onClick={() => {
              if (hasPendingBooking) {
                if (!window.confirm('¿Estás seguro? Tu reserva en progreso se guardará por 30 minutos.')) return;
              }
              navigate('/');
            }}
            className="w-full bg-[#ca9bcb] hover:bg-[#a35f9f] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 mt-6"
          >
            Volver
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center">
          © 2025 Travel Go. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}