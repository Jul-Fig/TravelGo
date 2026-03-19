import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API } from '../../config/api';
import {
  User, Mail, Phone, Calendar, Lock,
  Edit2, Save, X, LogOut, Ticket, Home,
  AlertCircle, CheckCircle2, Eye, EyeOff,
  Plane, MapPin, FileText, Shield,
} from 'lucide-react';

export default function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [user, setUser] = useState(null);
  const [reservasCompletas, setReservasCompletas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const [passwordData, setPasswordData] = useState({ actual: '', nueva: '', confirmar: '' });
  const [showPasswords, setShowPasswords] = useState({ actual: false, nueva: false, confirmar: false });

  // ── Detectar regreso desde reserva exitosa ───────────────────────────────
  useEffect(() => {
    if (location.state?.bookingSuccess) {
      setActiveTab('reservas');
      setSuccess(`Reserva confirmada. Número: ${location.state.confirmationNumber}`);
      window.history.replaceState({}, document.title);
      setTimeout(() => loadReservasCompletas(), 500);
      setTimeout(() => setSuccess(''), 5000);
    }
  }, [location]);

  useEffect(() => {
    loadUserData();
    loadReservasCompletas();
  }, []);

  // ── Carga de usuario ─────────────────────────────────────────────────────
  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const usuarioId = localStorage.getItem('usuarioId');
      if (!token || !usuarioId) { navigate('/login'); return; }

      // CORREGIDO: usa API.usuarios
      const response = await fetch(`${API.usuarios}/${usuarioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar datos');

      const data = await response.json();
      setUser(data);
      setEditData({
        primerNombre:   data.primerNombre,
        segundoNombre:  data.segundoNombre  || '',
        primerApellido: data.primerApellido,
        segundoApellido:data.segundoApellido|| '',
        telefono:       data.telefono,
        nacionalidad:   data.nacionalidad,
        fechaNacimiento:data.fechaNacimiento|| '',
        genero:         data.genero         || '',
      });
    } catch (err) {
      setError('No se pudieron cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // ── Carga de reservas completas ──────────────────────────────────────────
  const loadReservasCompletas = async () => {
    setLoadingReservas(true);
    try {
      const token = localStorage.getItem('token');
      const usuarioId = localStorage.getItem('usuarioId');
      if (!token || !usuarioId) return;

      // CORREGIDO: usa API.reservas
      const response = await fetch(
        `${API.reservas}/usuario/${usuarioId}/completas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Error al cargar reservas');

      const data = await response.json();
      setReservasCompletas(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('❌ Error al cargar reservas:', err);
      setReservasCompletas([]);
    } finally {
      setLoadingReservas(false);
    }
  };

  // ── Guardar cambios de perfil ────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const usuarioId = localStorage.getItem('usuarioId');

      // CORREGIDO: usa API.usuarios
      const response = await fetch(`${API.usuarios}/${usuarioId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, ...editData }),
      });
      if (!response.ok) throw new Error('Error al actualizar datos');

      const updatedUser = await response.json();
      setUser(updatedUser);
      setEditMode(false);
      setSuccess('Información actualizada correctamente');
      localStorage.setItem('primerNombre', editData.primerNombre);
      localStorage.setItem('primerApellido', editData.primerApellido);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al actualizar la información');
    } finally {
      setSaving(false);
    }
  };

  // ── Cambiar contraseña ───────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.nueva !== passwordData.confirmar) { setError('Las contraseñas no coinciden'); return; }
    if (passwordData.nueva.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }

    setSaving(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const credencialId = user.credencial.id;

      // CORREGIDO: usa API.usuarios
      const response = await fetch(`${API.usuarios}/cambiar-contrasena/${credencialId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaContrasena: passwordData.nueva }),
      });
      if (!response.ok) throw new Error('Error al cambiar contraseña');

      setSuccess('Contraseña actualizada correctamente');
      setPasswordData({ actual: '', nueva: '', confirmar: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancelar reserva ─────────────────────────────────────────────────────
  const handleCancelarReserva = async (reservaId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    try {
      const token = localStorage.getItem('token');
      // CORREGIDO: usa API.reservas
      const response = await fetch(`${API.reservas}/${reservaId}/cancelar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) { const d = await response.json(); throw new Error(d.error || 'Error al cancelar'); }
      setSuccess('Reserva cancelada correctamente');
      await loadReservasCompletas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error al cancelar: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  // ── Descargar PDF ────────────────────────────────────────────────────────
  const handleDescargarPDF = async (reservaId) => {
    try {
      const token = localStorage.getItem('token');
      setSuccess('Generando PDF...');
      // CORREGIDO: usa API.reservas
      const response = await fetch(`${API.reservas}/${reservaId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reserva_TG-${String(reservaId).padStart(8, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('PDF descargado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al descargar PDF. Inténtalo nuevamente.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (!window.confirm('¿Estás seguro que deseas cerrar sesión?')) return;
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('logout'));
    navigate('/');
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) age--;
    return age;
  };

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ── Loading / error screens ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-astronaut-light to-cosmic-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cosmic-base mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-astronaut-light to-cosmic-light flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar perfil</h2>
          <p className="text-gray-600 mb-6">No se pudo cargar la información del usuario</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-3 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors font-medium">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-astronaut-light to-cosmic-light py-8">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cosmic-base to-astronaut-base flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white">
                {user.primerNombre?.charAt(0)}{user.primerApellido?.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-astronaut-dark mb-2">
                {user.primerNombre} {user.segundoNombre || ''} {user.primerApellido} {user.segundoApellido || ''}
              </h1>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 text-gray-600 mb-4">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4"/><span>{user.credencial?.correo}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4"/><span>{user.telefono}</span></div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-4 py-2 bg-cosmic-light text-cosmic-dark rounded-full text-sm font-medium flex items-center gap-2">
                  <Ticket className="w-4 h-4"/> {reservasCompletas.length} Reservas
                </span>
                <span className="px-4 py-2 bg-astronaut-light text-astronaut-dark rounded-full text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4"/> Miembro desde 2025
                </span>
                {user.fechaNacimiento && (
                  <span className="px-4 py-2 bg-flame-light text-flame-dark rounded-full text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4"/> {calculateAge(user.fechaNacimiento)} años
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-cosmic-base hover:bg-cosmic-dark text-white rounded-lg transition-colors font-medium">
                <Home className="w-4 h-4"/> Inicio
              </button>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium">
                <LogOut className="w-4 h-4"/> Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'info',     label: 'Información Personal', icon: User },
                { id: 'reservas', label: 'Mis Reservas',         icon: Ticket },
                { id: 'security', label: 'Seguridad',            icon: Lock },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActiveTab(id); clearMessages(); }}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === id
                      ? 'border-cosmic-base text-cosmic-base bg-cosmic-light bg-opacity-10'
                      : 'border-transparent text-gray-600 hover:text-cosmic-base hover:bg-gray-50'
                  }`}>
                  <Icon className="w-5 h-5"/> {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Mensajes globales */}
            {error && (
              <div className="mb-6 flex items-center gap-2 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError('')} className="p-1 hover:bg-red-200 rounded"><X className="w-4 h-4"/></button>
              </div>
            )}
            {success && (
              <div className="mb-6 flex items-center gap-2 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0"/>
                <span className="flex-1">{success}</span>
                <button onClick={() => setSuccess('')} className="p-1 hover:bg-green-200 rounded"><X className="w-4 h-4"/></button>
              </div>
            )}

            {/* ── Tab: Información Personal ─────────────────────────────── */}
            {activeTab === 'info' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-astronaut-dark">Información Personal</h2>
                    <p className="text-gray-600 text-sm mt-1">Gestiona tu información de contacto y preferencias</p>
                  </div>
                  {!editMode ? (
                    <button onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors font-medium">
                      <Edit2 className="w-4 h-4"/> Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditMode(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium">
                        <X className="w-4 h-4"/> Cancelar
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-flame-base text-white rounded-lg hover:bg-flame-dark transition-colors disabled:opacity-50 font-medium">
                        <Save className="w-4 h-4"/> {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'primerNombre',   label: 'Primer nombre',    editable: false },
                    { key: 'primerApellido', label: 'Primer apellido',  editable: false },
                    { key: 'telefono',       label: 'Teléfono',         editable: true  },
                    { key: 'nacionalidad',   label: 'Nacionalidad',     editable: true  },
                  ].map(({ key, label, editable }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700">{label}</label>
                      <input type="text" value={editData[key] || ''}
                        onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={!editMode || !editable}
                        className={`mt-1 w-full border rounded-lg px-3 py-2 ${
                          editMode && editable
                            ? 'border-gray-300 focus:border-cosmic-base focus:ring-cosmic-base focus:ring-1 focus:outline-none'
                            : 'bg-gray-100 cursor-not-allowed'
                        }`}/>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                    <input type="date" value={editData.fechaNacimiento || ''}
                      onChange={e => setEditData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                      disabled={!editMode}
                      className={`mt-1 w-full border rounded-lg px-3 py-2 ${editMode ? 'border-gray-300 focus:border-cosmic-base focus:outline-none' : 'bg-gray-100 cursor-not-allowed'}`}/>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Género</label>
                    <select value={editData.genero || ''}
                      onChange={e => setEditData(prev => ({ ...prev, genero: e.target.value }))}
                      disabled={!editMode}
                      className={`mt-1 w-full border rounded-lg px-3 py-2 ${editMode ? 'border-gray-300 focus:border-cosmic-base focus:outline-none' : 'bg-gray-100 cursor-not-allowed'}`}>
                      <option value="">Selecciona...</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Femenino</option>
                      <option value="UNSPECIFIED">Otro</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                    <input type="email" value={user.credencial?.correo || ''} disabled
                      className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"/>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Reservas ─────────────────────────────────────────── */}
            {activeTab === 'reservas' && (
              <div>
                <h2 className="text-2xl font-bold text-astronaut-dark mb-2">Mis Reservas</h2>
                <p className="text-gray-600 text-sm mb-6">Historial completo de tus viajes y reservas</p>

                {loadingReservas ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-base mr-3"></div>
                    <span className="text-gray-600">Cargando reservas...</span>
                  </div>
                ) : reservasCompletas.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <Ticket className="w-20 h-20 text-gray-300 mx-auto mb-4"/>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes reservas aún</h3>
                    <p className="text-gray-500 mb-6">Comienza a planear tu próxima aventura</p>
                    <button onClick={() => navigate('/')}
                      className="px-6 py-3 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors font-medium inline-flex items-center gap-2">
                      <Plane className="w-5 h-5"/> Buscar vuelos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reservasCompletas.map(reserva => (
                      <div key={reserva.id}
                        className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white">

                        {/* Header de la reserva */}
                        <div className="bg-gradient-to-r from-cosmic-base to-astronaut-base p-6 text-white">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <Ticket className="w-8 h-8"/>
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold">Confirmación: {reserva.numeroConfirmacion}</h3>
                                <p className="text-sm text-white text-opacity-90 flex items-center gap-2 mt-1">
                                  <Calendar className="w-4 h-4"/>
                                  {new Date(reserva.fechaReserva).toLocaleDateString('es-ES', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-6 py-2 rounded-full text-sm font-bold shadow-lg ${
                                reserva.estado === 'confirmada' ? 'bg-green-500 text-white'
                                  : reserva.estado === 'pendiente' ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}>
                                {reserva.estado === 'confirmada' ? '✓ Confirmada'
                                  : reserva.estado === 'pendiente' ? '⏳ Pendiente'
                                  : '✗ Cancelada'}
                              </span>
                              {reserva.estado === 'confirmada' && (
                                <button onClick={() => handleCancelarReserva(reserva.id)}
                                  className="text-sm text-white hover:text-red-200 underline">
                                  Cancelar reserva
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalles */}
                        <div className="p-6 space-y-6">
                          {reserva.viaje && (
                            <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-xl">
                              <div className="flex items-center gap-3 mb-4">
                                <Plane className="w-6 h-6 text-blue-600"/>
                                <h4 className="text-xl font-bold text-gray-800">Vuelo</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">Ruta</p>
                                  <p className="text-lg font-bold text-gray-800">{reserva.viaje.origen} → {reserva.viaje.destino}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">Fecha de Salida</p>
                                  <p className="text-lg font-semibold text-gray-800">
                                    {new Date(reserva.viaje.fechaSalida).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">Precio</p>
                                  <p className="text-xl font-bold text-blue-600">{reserva.viaje.precio} {reserva.viaje.moneda}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {reserva.hotel && (
                            <div className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50 rounded-r-xl">
                              <div className="flex items-center gap-3 mb-4">
                                <MapPin className="w-6 h-6 text-purple-600"/>
                                <h4 className="text-xl font-bold text-gray-800">Hotel</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><p className="text-sm text-gray-600 font-medium">Nombre</p><p className="text-lg font-semibold text-gray-800">{reserva.hotel.nombre}</p></div>
                                <div><p className="text-sm text-gray-600 font-medium">Ciudad</p><p className="text-lg font-semibold text-gray-800">{reserva.hotel.ciudad}</p></div>
                                <div><p className="text-sm text-gray-600 font-medium">Precio</p><p className="text-xl font-bold text-purple-600">{reserva.hotel.precio} USD</p></div>
                              </div>
                            </div>
                          )}

                          {reserva.transporte && (
                            <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 rounded-r-xl">
                              <div className="flex items-center gap-3 mb-4">
                                <MapPin className="w-6 h-6 text-green-600"/>
                                <h4 className="text-xl font-bold text-gray-800">Transporte</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><p className="text-sm text-gray-600 font-medium">Tipo</p><p className="text-lg font-semibold text-gray-800">{reserva.transporte.vehiculoTipo || reserva.transporte.tipo}</p></div>
                                <div><p className="text-sm text-gray-600 font-medium">Desde</p><p className="text-lg font-semibold text-gray-800">{reserva.transporte.origen}</p></div>
                                <div><p className="text-sm text-gray-600 font-medium">Hasta</p><p className="text-lg font-semibold text-gray-800">{reserva.transporte.destino}</p></div>
                                <div><p className="text-sm text-gray-600 font-medium">Precio</p><p className="text-xl font-bold text-green-600">{reserva.transporte.precio} {reserva.transporte.moneda}</p></div>
                              </div>
                            </div>
                          )}

                          {reserva.pago && (
                            <div className="border-l-4 border-orange-500 pl-6 py-4 bg-orange-50 rounded-r-xl">
                              <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-orange-600"/>
                                <h4 className="text-xl font-bold text-gray-800">Información de Pago</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><p className="text-sm text-gray-600 font-medium">Método</p><p className="text-lg font-semibold text-gray-800 capitalize">{reserva.pago.metodoPago}</p></div>
                                <div><p className="text-sm text-gray-600 font-medium">Fecha</p><p className="text-lg font-semibold text-gray-800">{new Date(reserva.pago.fechaPago).toLocaleDateString('es-ES')}</p></div>
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">Estado</p>
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${reserva.pago.estado === 'pagado' ? 'bg-green-200 text-green-800' : reserva.pago.estado === 'pendiente' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                                    {reserva.pago.estado.toUpperCase()}
                                  </span>
                                </div>
                                <div><p className="text-sm text-gray-600 font-medium">Total</p><p className="text-2xl font-bold text-orange-600">{reserva.pago.monto} USD</p></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t">
                          <div className="text-sm text-gray-600">
                            ID de Reserva: <span className="font-mono font-bold">{reserva.id}</span>
                          </div>
                          <button onClick={() => handleDescargarPDF(reserva.id)}
                            className="px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4"/> Descargar PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Seguridad ────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-astronaut-dark mb-2">Seguridad de la Cuenta</h2>
                <p className="text-gray-600 text-sm mb-6">Mantén tu cuenta segura actualizando tu contraseña regularmente</p>

                <form onSubmit={handleChangePassword} className="max-w-md space-y-6">
                  {[
                    { key: 'actual',    label: 'Contraseña Actual *' },
                    { key: 'nueva',     label: 'Nueva Contraseña *' },
                    { key: 'confirmar', label: 'Confirmar Nueva Contraseña *' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                      <div className="relative">
                        <input
                          type={showPasswords[key] ? 'text' : 'password'}
                          value={passwordData[key]}
                          onChange={e => setPasswordData(prev => ({ ...prev, [key]: e.target.value }))}
                          required minLength={key !== 'actual' ? 6 : undefined}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"
                          placeholder="••••••••"
                        />
                        <button type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700">
                          {showPasswords[key] ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                        </button>
                      </div>
                    </div>
                  ))}

                  {passwordData.nueva && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Seguridad de la contraseña:</p>
                      <div className="flex gap-1 mb-2">
                        {[
                          passwordData.nueva.length >= 6,
                          passwordData.nueva.length >= 8,
                          /[A-Z]/.test(passwordData.nueva),
                          /[0-9]/.test(passwordData.nueva),
                        ].map((ok, i) => (
                          <div key={i} className={`h-2 flex-1 rounded ${ok ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        ))}
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className={passwordData.nueva.length >= 6 ? 'text-green-600' : ''}>• Al menos 6 caracteres</li>
                        <li className={passwordData.nueva.length >= 8 ? 'text-green-600' : ''}>• Recomendado: 8+ caracteres</li>
                        <li className={/[A-Z]/.test(passwordData.nueva) ? 'text-green-600' : ''}>• Incluir mayúsculas</li>
                        <li className={/[0-9]/.test(passwordData.nueva) ? 'text-green-600' : ''}>• Incluir números</li>
                      </ul>
                    </div>
                  )}

                  <button type="submit" disabled={saving}
                    className="w-full bg-flame-base hover:bg-flame-dark text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Cambiando contraseña...</>
                    ) : (
                      <><Lock className="w-5 h-5"/> Cambiar Contraseña</>
                    )}
                  </button>
                </form>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5"/> Consejos de seguridad
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Usa una contraseña única que no uses en otros sitios</li>
                    <li>• Combina letras, números y símbolos</li>
                    <li>• No compartas tu contraseña con nadie</li>
                    <li>• Cambia tu contraseña cada 3-6 meses</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}