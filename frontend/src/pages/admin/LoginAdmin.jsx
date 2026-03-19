import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { API } from '../../config/api';

export default function AdminLogin() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // CORREGIDO: usa API.admin en lugar de URL hardcodeada
      const response = await fetch(`${API.admin}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuarioId', data.usuarioId);
        localStorage.setItem('correo', data.correo);
        localStorage.setItem('primerNombre', data.primerNombre || 'Admin');
        localStorage.setItem('primerApellido', data.primerApellido || '');
        localStorage.setItem('tipoUsuario', data.tipoUsuario);
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error('❌ Error de conexión:', err);
      setError(`Error de conexión. Verifica que el backend esté en ${API.base}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-astronaut-dark via-cosmic-dark to-astronaut-dark relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cosmic-base opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-flame-base opacity-20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-cosmic-base to-flame-base rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-white"/>
            </div>
            <h2 className="text-3xl font-bold text-cosmic-base mb-2">Admin Panel</h2>
            <p className="text-gray-600 text-sm">Panel de Administración TravelGo</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0"/>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>
              <input
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent transition-all"
                placeholder="admin@travelgo.com"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent transition-all"
                placeholder="••••••••"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                required
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
                {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-cosmic-base to-astronaut-base hover:from-cosmic-dark hover:to-astronaut-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Iniciando sesión...
              </span>
            ) : 'Iniciar sesión'}
          </button>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿No eres administrador?{' '}
              <button type="button" onClick={() => navigate('/login')}
                className="text-cosmic-base hover:text-cosmic-dark font-medium transition-colors">
                Ir a login de usuarios
              </button>
            </p>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            Backend en{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">{API.base}</code>
          </p>
        </div>
      </div>
    </div>
  );
}