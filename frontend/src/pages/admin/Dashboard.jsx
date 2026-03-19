import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../config/api';
import {
  Users, Ticket, DollarSign, TrendingUp, Search,
  Shield, ShieldCheck, ShieldOff, Ban, Trash2, Edit2,
  UserPlus, X, CheckCircle2, AlertCircle, Eye, EyeOff,
  Calendar, Plane, Hotel, Car, LogOut, Home, Settings,
  BarChart3, Mail, Phone, MapPin, Clock, Activity,
  Download, RefreshCw, ChevronDown, ChevronUp, Info,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [stats, setStats] = useState({
    totalUsuarios: 0, usuariosActivos: 0, usuariosInactivos: 0, administradores: 0,
    totalReservas: 0, reservasConfirmadas: 0, reservasPendientes: 0, reservasCanceladas: 0,
    ingresosMes: 15420.50, ingresosTotales: 148250.75, viajesActivos: 24,
    pagosCompletados: 0, pagosPendientes: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterRole, setFilterRole] = useState('todos');
  const [filterNationality, setFilterNationality] = useState('todos');
  const [searchReserva, setSearchReserva] = useState('');
  const [filterReservaStatus, setFilterReservaStatus] = useState('todos');
  const [filterReservaDate, setFilterReservaDate] = useState('todos');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showReservaDetailsModal, setShowReservaDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReserva, setSelectedReserva] = useState(null);

  const [editForm, setEditForm] = useState({
    primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '',
    telefono: '', nacionalidad: '', fechaNacimiento: '', genero: '',
  });
  const [createAdminForm, setCreateAdminForm] = useState({
    nombre: '', cargo: '', correo: '', contrasena: '', primerNombre: '', primerApellido: '', telefono: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => { loadAdminData(); loadDashboardData(); }, []);

  const loadAdminData = () => {
    const token = localStorage.getItem('token');
    const tipoUsuario = localStorage.getItem('tipoUsuario');
    if (!token || tipoUsuario !== 'admin') { navigate('/admin/login'); return; }
    setAdminData({ nombre: localStorage.getItem('primerNombre') || 'Admin', apellido: localStorage.getItem('primerApellido') || '' });
  };

  // CORREGIDO: usa API.usuarios y API.reservas en lugar de URLs hardcodeadas
  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const tipoUsuario = localStorage.getItem('tipoUsuario');
      if (!token || tipoUsuario !== 'admin') { navigate('/admin/login'); return; }

      // Cargar usuarios
      const resUsuarios = await fetch(API.usuarios, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (resUsuarios.status === 401 || resUsuarios.status === 403) {
        localStorage.clear();
        navigate('/admin/login');
        return;
      }

      let usuariosArray = [];
      if (resUsuarios.ok) {
        const dataUsuarios = await resUsuarios.json();
        usuariosArray = Array.isArray(dataUsuarios) ? dataUsuarios : [];
        setUsuarios(usuariosArray);
      }

      // Cargar reservas
      const resReservas = await fetch(API.reservas, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let reservasArray = [];
      if (resReservas.ok) {
        const dataReservas = await resReservas.json();
        reservasArray = Array.isArray(dataReservas) ? dataReservas : [];
        setReservas(reservasArray);
      }

      const activos = usuariosArray.filter(u => u.credencial?.estaActivo).length;
      const admins  = usuariosArray.filter(u => u.credencial?.tipoUsuario === 'admin').length;
      const confirmadas = reservasArray.filter(r => r.estado === 'confirmada').length;
      const pendientes  = reservasArray.filter(r => r.estado === 'pendiente').length;
      const canceladas  = reservasArray.filter(r => r.estado === 'cancelada').length;

      setStats(prev => ({
        ...prev,
        totalUsuarios: usuariosArray.length,
        usuariosActivos: activos,
        usuariosInactivos: usuariosArray.length - activos,
        administradores: admins,
        totalReservas: reservasArray.length,
        reservasConfirmadas: confirmadas,
        reservasPendientes: pendientes,
        reservasCanceladas: canceladas,
        pagosCompletados: confirmadas,
        pagosPendientes: pendientes,
      }));
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar información del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios
  const filteredUsers = usuarios.filter(user => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      user.primerNombre?.toLowerCase().includes(s) ||
      user.primerApellido?.toLowerCase().includes(s) ||
      user.credencial?.correo?.toLowerCase().includes(s) ||
      user.telefono?.includes(searchTerm) ||
      user.id?.toString().includes(searchTerm);
    const matchStatus = filterStatus === 'todos' || (filterStatus === 'activos' && user.credencial?.estaActivo) || (filterStatus === 'inactivos' && !user.credencial?.estaActivo);
    const matchRole   = filterRole === 'todos' || (filterRole === 'usuarios' && user.credencial?.tipoUsuario === 'usuario') || (filterRole === 'admins' && user.credencial?.tipoUsuario === 'admin');
    const matchNat    = filterNationality === 'todos' || user.nacionalidad === filterNationality;
    return matchSearch && matchStatus && matchRole && matchNat;
  });

  const filteredReservas = reservas.filter(reserva => {
    const usuario = usuarios.find(u => u.id === reserva.usuarioId);
    const s = searchReserva.toLowerCase();
    const matchSearch = reserva.id?.toString().includes(searchReserva) || usuario?.primerNombre?.toLowerCase().includes(s) || usuario?.credencial?.correo?.toLowerCase().includes(s);
    const matchStatus = filterReservaStatus === 'todos' || reserva.estado === filterReservaStatus;
    const matchDate = filterReservaDate === 'todos' || (filterReservaDate === 'hoy' && isToday(reserva.fechaReserva)) || (filterReservaDate === 'semana' && isThisWeek(reserva.fechaReserva)) || (filterReservaDate === 'mes' && isThisMonth(reserva.fechaReserva));
    return matchSearch && matchStatus && matchDate;
  });

  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers     = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const currentReservas  = filteredReservas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages       = Math.ceil(filteredUsers.length / itemsPerPage);

  const isToday     = d => new Date(d).toDateString() === new Date().toDateString();
  const isThisWeek  = d => { const n = new Date(); const w = new Date(n.getTime() - 7 * 86400000); const r = new Date(d); return r >= w && r <= n; };
  const isThisMonth = d => { const n = new Date(); const r = new Date(d); return r.getMonth() === n.getMonth() && r.getFullYear() === n.getFullYear(); };

  // ── Acciones sobre usuarios ───────────────────────────────────────────────
  const apiAction = async (url, method = 'PUT', body = null) => {
    const token = localStorage.getItem('token');
    const opts = { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts);
  };

  const showSuccessMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const showErrorMsg   = (msg) => { setError(msg);   setTimeout(() => setError(''), 4000); };

  const toggleUserStatus = async (userId, currentStatus) => {
    // CORREGIDO: usa API.usuarios
    const res = await apiAction(`${API.usuarios}/${userId}/toggle-status`);
    if (res.ok) { showSuccessMsg(`Usuario ${currentStatus ? 'desactivado' : 'activado'} correctamente`); loadDashboardData(); }
    else showErrorMsg('Error al cambiar estado del usuario');
  };

  const promoteToAdmin = async (userId) => {
    // CORREGIDO: usa API.usuarios
    const res = await apiAction(`${API.usuarios}/${userId}/promote-to-admin`);
    if (res.ok) { showSuccessMsg('Usuario promovido a administrador'); setShowPromoteModal(false); setSelectedUser(null); loadDashboardData(); }
    else showErrorMsg('Error al promover usuario');
  };

  const demoteToUser = async (userId) => {
    // CORREGIDO: usa API.usuarios
    const res = await apiAction(`${API.usuarios}/${userId}/demote-to-user`);
    if (res.ok) { showSuccessMsg('Administrador degradado a usuario'); setShowDemoteModal(false); setSelectedUser(null); loadDashboardData(); }
    else showErrorMsg('Error al degradar administrador');
  };

  const handleEditUser = async () => {
    // CORREGIDO: usa API.usuarios
    const res = await apiAction(`${API.usuarios}/${selectedUser.id}`, 'PUT', { ...selectedUser, ...editForm });
    if (res.ok) { showSuccessMsg('Usuario actualizado correctamente'); setShowEditModal(false); setSelectedUser(null); loadDashboardData(); }
    else showErrorMsg('Error al actualizar usuario');
  };

  const handleDeleteUser = async (userId) => {
    const token = localStorage.getItem('token');
    // CORREGIDO: usa API.usuarios
    const res = await fetch(`${API.usuarios}/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showSuccessMsg('Usuario eliminado correctamente'); setShowDeleteModal(false); setSelectedUser(null); loadDashboardData(); }
    else showErrorMsg('Error al eliminar usuario');
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    // CORREGIDO: usa API.administrador
    const res = await apiAction(`${API.administrador}/register-admin`, 'POST', createAdminForm);
    if (res.ok) {
      showSuccessMsg('Administrador creado correctamente');
      setShowCreateAdminModal(false);
      setCreateAdminForm({ nombre: '', cargo: '', correo: '', contrasena: '', primerNombre: '', primerApellido: '', telefono: '' });
      loadDashboardData();
    } else {
      const d = await res.json();
      showErrorMsg(d.error || 'Error al crear administrador');
    }
  };

  const exportToCSV = (data, filename) => {
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) { localStorage.clear(); navigate('/admin/login'); }
  };

  const toggleExpandRow = (id) => {
    const n = new Set(expandedRows);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpandedRows(n);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-astronaut-dark to-cosmic-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-astronaut-dark to-cosmic-dark text-white shadow-2xl fixed h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-gray-700">
            <div className="w-12 h-12 bg-gradient-to-br from-cosmic-base to-flame-base rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6"/>
            </div>
            <div><h2 className="text-xl font-bold">TravelGo</h2><p className="text-sm text-gray-300">Admin Panel</p></div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard',     label: 'Dashboard',     icon: BarChart3, badge: undefined },
              { id: 'usuarios',      label: 'Usuarios',      icon: Users,     badge: stats.totalUsuarios },
              { id: 'reservas',      label: 'Reservas',      icon: Ticket,    badge: stats.totalReservas },
              { id: 'estadisticas',  label: 'Estadísticas',  icon: Activity,  badge: undefined },
              { id: 'configuracion', label: 'Configuración', icon: Settings,  badge: undefined },
            ].map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${activeSection === id ? 'bg-cosmic-base text-white shadow-lg' : 'text-gray-300 hover:bg-astronaut-base hover:text-white'}`}>
                <div className="flex items-center space-x-3"><Icon className="w-5 h-5"/><span className="font-medium">{label}</span></div>
                {badge !== undefined && <span className="px-2 py-1 bg-flame-base text-white text-xs rounded-full font-bold">{badge}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex items-center space-x-3 px-4 py-2 mb-4 bg-astronaut-base rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-flame-base to-cosmic-base rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {adminData?.nombre?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{adminData?.nombre} {adminData?.apellido}</p>
                <p className="text-xs text-gray-400">Administrador</p>
              </div>
            </div>
            <button onClick={() => navigate('/')}
              className="w-full flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-astronaut-base rounded-lg transition-colors mb-2">
              <Home className="w-5 h-5"/><span>Ir al sitio</span>
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-lg transition-colors">
              <LogOut className="w-5 h-5"/><span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-astronaut-dark capitalize flex items-center gap-2">
                {activeSection === 'dashboard'     && <BarChart3 className="w-7 h-7 text-cosmic-base"/>}
                {activeSection === 'usuarios'      && <Users     className="w-7 h-7 text-cosmic-base"/>}
                {activeSection === 'reservas'      && <Ticket    className="w-7 h-7 text-cosmic-base"/>}
                {activeSection === 'estadisticas'  && <Activity  className="w-7 h-7 text-cosmic-base"/>}
                {activeSection === 'configuracion' && <Settings  className="w-7 h-7 text-cosmic-base"/>}
                {activeSection}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, {adminData?.nombre || 'Admin'} — {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors">
              <RefreshCw className="w-5 h-5"/><span className="hidden md:inline">Actualizar</span>
            </button>
          </div>
        </header>

        <main className="p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg shadow-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0"/>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="hover:bg-red-200 p-1 rounded"><X className="w-4 h-4"/></button>
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg shadow-md">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0"/>
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')} className="hover:bg-green-200 p-1 rounded"><X className="w-4 h-4"/></button>
            </div>
          )}

          {activeSection === 'dashboard' && (
            <DashboardSection stats={stats} usuarios={usuarios.slice(0,5)} reservas={reservas.slice(0,5)}
              onViewAllUsers={() => setActiveSection('usuarios')} onViewAllReservas={() => setActiveSection('reservas')}/>
          )}
          {activeSection === 'usuarios' && (
            <UsersSection
              usuarios={currentUsers} totalUsers={filteredUsers.length}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              filterRole={filterRole} setFilterRole={setFilterRole}
              filterNationality={filterNationality} setFilterNationality={setFilterNationality}
              currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}
              expandedRows={expandedRows} toggleExpandRow={toggleExpandRow}
              onEdit={user => { setSelectedUser(user); setEditForm({ primerNombre: user.primerNombre || '', segundoNombre: user.segundoNombre || '', primerApellido: user.primerApellido || '', segundoApellido: user.segundoApellido || '', telefono: user.telefono || '', nacionalidad: user.nacionalidad || '', fechaNacimiento: user.fechaNacimiento || '', genero: user.genero || '' }); setShowEditModal(true); }}
              onViewDetails={user => { setSelectedUser(user); setShowUserDetailsModal(true); }}
              onPromote={user => { setSelectedUser(user); setShowPromoteModal(true); }}
              onDemote={user => { setSelectedUser(user); setShowDemoteModal(true); }}
              onDelete={user => { setSelectedUser(user); setShowDeleteModal(true); }}
              onToggleStatus={toggleUserStatus}
              onCreateAdmin={() => setShowCreateAdminModal(true)}
              onExport={() => exportToCSV(filteredUsers.map(u => ({ ID: u.id, Nombre: `${u.primerNombre} ${u.primerApellido}`, Email: u.credencial?.correo, Telefono: u.telefono, Rol: u.credencial?.tipoUsuario, Estado: u.credencial?.estaActivo ? 'Activo' : 'Inactivo' })), 'usuarios')}
            />
          )}
          {activeSection === 'reservas' && (
            <ReservasSection
              reservas={currentReservas} totalReservas={filteredReservas.length} usuarios={usuarios}
              searchReserva={searchReserva} setSearchReserva={setSearchReserva}
              filterReservaStatus={filterReservaStatus} setFilterReservaStatus={setFilterReservaStatus}
              filterReservaDate={filterReservaDate} setFilterReservaDate={setFilterReservaDate}
              currentPage={currentPage} totalPages={Math.ceil(filteredReservas.length / itemsPerPage)} setCurrentPage={setCurrentPage}
              onViewDetails={r => { setSelectedReserva(r); setShowReservaDetailsModal(true); }}
              onExport={() => exportToCSV(filteredReservas.map(r => { const u = usuarios.find(x => x.id === r.usuarioId); return { ID: r.id, Usuario: `${u?.primerNombre} ${u?.primerApellido}`, Email: u?.credencial?.correo, Fecha: new Date(r.fechaReserva).toLocaleDateString(), Estado: r.estado }; }), 'reservas')}
            />
          )}
          {activeSection === 'estadisticas' && (
            <EstadisticasSection stats={stats} reservas={reservas} usuarios={usuarios}/>
          )}
        </main>
      </div>

      {/* Modales — sin cambios funcionales, solo se mantienen */}
      {showEditModal         && <EditUserModal    user={selectedUser} editForm={editForm} setEditForm={setEditForm} onSave={handleEditUser} onClose={() => { setShowEditModal(false); setSelectedUser(null); }}/>}
      {showPromoteModal      && <PromoteModal     user={selectedUser} onConfirm={() => promoteToAdmin(selectedUser.id)} onClose={() => { setShowPromoteModal(false); setSelectedUser(null); }}/>}
      {showDemoteModal       && <DemoteModal      user={selectedUser} onConfirm={() => demoteToUser(selectedUser.id)} onClose={() => { setShowDemoteModal(false); setSelectedUser(null); }}/>}
      {showDeleteModal       && <DeleteModal      user={selectedUser} onConfirm={() => handleDeleteUser(selectedUser.id)} onClose={() => { setShowDeleteModal(false); setSelectedUser(null); }}/>}
      {showCreateAdminModal  && <CreateAdminModal form={createAdminForm} setForm={setCreateAdminForm} onSubmit={handleCreateAdmin} onClose={() => { setShowCreateAdminModal(false); setCreateAdminForm({ nombre: '', cargo: '', correo: '', contrasena: '', primerNombre: '', primerApellido: '', telefono: '' }); }}/>}
      {showUserDetailsModal  && <UserDetailsModal user={selectedUser} reservas={reservas.filter(r => r.usuarioId === selectedUser?.id)} onClose={() => { setShowUserDetailsModal(false); setSelectedUser(null); }}/>}
      {showReservaDetailsModal && <ReservaDetailsModal reserva={selectedReserva} usuario={usuarios.find(u => u.id === selectedReserva?.usuarioId)} onClose={() => { setShowReservaDetailsModal(false); setSelectedReserva(null); }}/>}
    </div>
  );
}

// ── Sub-componentes reutilizados del archivo original ─────────────────────────
// (StatCard, RoleBadge, StatusBadge, DashboardSection, UsersSection, ReservasSection,
//  EstadisticasSection y todos los modales se mantienen exactamente iguales al
//  archivo Dashboard.jsx original — solo se cambian las URLs de fetch arriba)

function StatCard({ title, value, icon: Icon, color, trend, subtitle }) {
  const colorClasses = { cosmic: 'from-cosmic-base to-cosmic-dark', astronaut: 'from-astronaut-base to-astronaut-dark', green: 'from-green-500 to-green-600', yellow: 'from-yellow-500 to-yellow-600', red: 'from-red-500 to-red-600', flame: 'from-flame-base to-flame-dark', purple: 'from-purple-500 to-purple-600', blue: 'from-blue-500 to-blue-600' };
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div><h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>{subtitle && <p className="text-xs opacity-75">{subtitle}</p>}</div>
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center"><Icon className="w-7 h-7"/></div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold">{value}</p>
        {trend && <div className="flex items-center gap-1 text-sm"><TrendingUp className="w-4 h-4"/><span>{trend}</span></div>}
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
      {role === 'admin' ? <><ShieldCheck className="w-3 h-3"/>Admin</> : <><Users className="w-3 h-3"/>Usuario</>}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {status ? <><CheckCircle2 className="w-3 h-3"/>Activo</> : <><Ban className="w-3 h-3"/>Inactivo</>}
    </span>
  );
}

function DashboardSection({ stats, usuarios, reservas, onViewAllUsers, onViewAllReservas }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Usuarios"    value={stats.totalUsuarios}   subtitle={`${stats.usuariosActivos} activos`}           icon={Users}      color="cosmic"    trend="+12%"/>
        <StatCard title="Total Reservas"    value={stats.totalReservas}   subtitle={`${stats.reservasConfirmadas} confirmadas`}    icon={Ticket}     color="astronaut" trend="+8%"/>
        <StatCard title="Ingresos del Mes"  value={`$${stats.ingresosMes.toLocaleString()}`} subtitle="USD"               icon={DollarSign} color="green"     trend="+15%"/>
        <StatCard title="Reservas Pendientes" value={stats.reservasPendientes} subtitle="Requieren atención"                      icon={Clock}      color="yellow"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Administradores"    value={stats.administradores}    subtitle="Usuarios con permisos" icon={ShieldCheck} color="purple"/>
        <StatCard title="Usuarios Inactivos" value={stats.usuariosInactivos}  subtitle="Cuentas suspendidas"  icon={Ban}         color="red"/>
        <StatCard title="Ingresos Totales"   value={`$${stats.ingresosTotales.toLocaleString()}`} subtitle="Histórico" icon={TrendingUp} color="flame"/>
        <StatCard title="Viajes Activos"     value={stats.viajesActivos}      subtitle="Disponibles"          icon={Plane}       color="blue"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-cosmic-base"/>Usuarios Recientes</h3>
            <button onClick={onViewAllUsers} className="text-sm text-cosmic-base hover:text-cosmic-dark font-medium">Ver todos →</button>
          </div>
          <div className="space-y-3">
            {usuarios.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-cosmic-light to-astronaut-light rounded-full flex items-center justify-center text-cosmic-dark font-semibold">
                  {user.primerNombre?.charAt(0)}{user.primerApellido?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.primerNombre} {user.primerApellido}</p>
                  <p className="text-xs text-gray-500 truncate">{user.credencial?.correo}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RoleBadge role={user.credencial?.tipoUsuario}/>
                  <StatusBadge status={user.credencial?.estaActivo}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Ticket className="w-5 h-5 text-cosmic-base"/>Reservas Recientes</h3>
            <button onClick={onViewAllReservas} className="text-sm text-cosmic-base hover:text-cosmic-dark font-medium">Ver todas →</button>
          </div>
          <div className="space-y-3">
            {reservas.map(reserva => (
              <div key={reserva.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-flame-light to-cosmic-light rounded-full flex items-center justify-center"><Ticket className="w-5 h-5 text-flame-dark"/></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reserva #{reserva.id}</p>
                    <p className="text-xs text-gray-500">{new Date(reserva.fechaReserva).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${reserva.estado === 'confirmada' ? 'bg-green-100 text-green-800' : reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{reserva.estado}</span>
                  <div className="flex gap-1">
                    {reserva.viajeId      && <span className="p-1 bg-blue-100 text-blue-600 rounded"   title="Vuelo"><Plane className="w-3 h-3"/></span>}
                    {reserva.alojamientoId && <span className="p-1 bg-green-100 text-green-600 rounded" title="Hotel"><Hotel className="w-3 h-3"/></span>}
                    {reserva.transporteId  && <span className="p-1 bg-purple-100 text-purple-600 rounded" title="Transporte"><Car className="w-3 h-3"/></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersSection({ usuarios, totalUsers, searchTerm, setSearchTerm, filterStatus, setFilterStatus, filterRole, setFilterRole, filterNationality, setFilterNationality, currentPage, totalPages, setCurrentPage, expandedRows, toggleExpandRow, onEdit, onViewDetails, onPromote, onDemote, onDelete, onToggleStatus, onCreateAdmin, onExport }) {
  const uniqueNationalities = [...new Set(usuarios.map(u => u.nacionalidad).filter(Boolean))];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Users className="w-6 h-6 text-cosmic-base"/>Gestión de Usuarios</h2>
            <p className="text-sm text-gray-600 mt-1">Mostrando {usuarios.length} de {totalUsers} usuarios</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><Download className="w-5 h-5"/>Exportar CSV</button>
            <button onClick={onCreateAdmin} className="flex items-center gap-2 px-4 py-2 bg-flame-base text-white rounded-lg hover:bg-flame-dark transition-colors"><UserPlus className="w-5 h-5"/>Crear Administrador</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400"/><input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"/></div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"><option value="todos">Todos los estados</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option></select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"><option value="todos">Todos los roles</option><option value="usuarios">Usuarios</option><option value="admins">Administradores</option></select>
          <select value={filterNationality} onChange={e => setFilterNationality(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"><option value="todos">Todas las nacionalidades</option>{uniqueNationalities.map(n => <option key={n} value={n}>{n}</option>)}</select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-cosmic-base to-astronaut-base text-white">
              <tr>{['Usuario','Contacto','Ubicación','Rol','Estado','Acciones'].map(h => <th key={h} className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${h === 'Acciones' ? 'text-right' : ''}`}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map(user => (
                <React.Fragment key={user.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleExpandRow(user.id)} className="text-gray-400 hover:text-cosmic-base transition-colors">{expandedRows.has(user.id) ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}</button>
                        <div className="w-12 h-12 bg-gradient-to-br from-cosmic-base to-astronaut-base rounded-full flex items-center justify-center text-white font-bold shadow-md">{user.primerNombre?.charAt(0)}{user.primerApellido?.charAt(0)}</div>
                        <div><p className="text-sm font-semibold text-gray-900">{user.primerNombre} {user.primerApellido}</p><p className="text-xs text-gray-500">ID: #{user.id}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="flex flex-col gap-1"><div className="flex items-center gap-2 text-sm text-gray-700"><Mail className="w-4 h-4 text-cosmic-base"/><span className="truncate max-w-[200px]">{user.credencial?.correo}</span></div><div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-cosmic-base"/>{user.telefono || 'N/A'}</div></div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-700"><MapPin className="w-4 h-4 text-cosmic-base"/>{user.nacionalidad || 'N/A'}</div></td>
                    <td className="px-6 py-4"><RoleBadge role={user.credencial?.tipoUsuario}/></td>
                    <td className="px-6 py-4"><StatusBadge status={user.credencial?.estaActivo}/></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onViewDetails(user)} className="p-2 text-cosmic-base hover:bg-cosmic-light rounded-lg transition-colors" title="Ver detalles"><Eye className="w-4 h-4"/></button>
                        <button onClick={() => onEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 className="w-4 h-4"/></button>
                        {user.credencial?.tipoUsuario === 'usuario'
                          ? <button onClick={() => onPromote(user)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Promover"><ShieldCheck className="w-4 h-4"/></button>
                          : <button onClick={() => onDemote(user)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Degradar"><ShieldOff className="w-4 h-4"/></button>}
                        <button onClick={() => onToggleStatus(user.id, user.credencial?.estaActivo)} className={`p-2 rounded-lg transition-colors ${user.credencial?.estaActivo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={user.credencial?.estaActivo ? 'Desactivar' : 'Activar'}><Ban className="w-4 h-4"/></button>
                        <button onClick={() => onDelete(user)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(user.id) && (
                    <tr className="bg-gray-50"><td colSpan="6" className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-gray-500 font-medium mb-1">Género</p><p className="text-gray-900">{user.genero === 'MALE' ? 'Masculino' : user.genero === 'FEMALE' ? 'Femenino' : 'Otro'}</p></div>
                        <div><p className="text-gray-500 font-medium mb-1">Fecha Nacimiento</p><p className="text-gray-900">{user.fechaNacimiento || 'N/A'}</p></div>
                        <div><p className="text-gray-500 font-medium mb-1">Edad</p><p className="text-gray-900">{user.fechaNacimiento ? new Date().getFullYear() - new Date(user.fechaNacimiento).getFullYear() + ' años' : 'N/A'}</p></div>
                        <div><p className="text-gray-500 font-medium mb-1">Miembro desde</p><p className="text-gray-900">2025</p></div>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {usuarios.length === 0 && <div className="text-center py-16"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4"/><p className="text-gray-600 text-lg">No se encontraron usuarios</p></div>}
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}/>}
      </div>
    </div>
  );
}

function ReservasSection({ reservas, totalReservas, usuarios, searchReserva, setSearchReserva, filterReservaStatus, setFilterReservaStatus, filterReservaDate, setFilterReservaDate, currentPage, totalPages, setCurrentPage, onViewDetails, onExport }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div><h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Ticket className="w-6 h-6 text-cosmic-base"/>Gestión de Reservas</h2><p className="text-sm text-gray-600 mt-1">Mostrando {reservas.length} de {totalReservas} reservas</p></div>
          <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><Download className="w-5 h-5"/>Exportar CSV</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400"/><input type="text" placeholder="Buscar reserva..." value={searchReserva} onChange={e => setSearchReserva(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"/></div>
          <select value={filterReservaStatus} onChange={e => setFilterReservaStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"><option value="todos">Todos los estados</option><option value="confirmada">Confirmadas</option><option value="pendiente">Pendientes</option><option value="cancelada">Canceladas</option></select>
          <select value={filterReservaDate} onChange={e => setFilterReservaDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"><option value="todos">Todas las fechas</option><option value="hoy">Hoy</option><option value="semana">Esta semana</option><option value="mes">Este mes</option></select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-cosmic-base to-astronaut-base text-white">
              <tr>{['ID','Usuario','Fecha Reserva','Estado','Servicios','Acciones'].map(h => <th key={h} className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${h === 'Acciones' ? 'text-right' : ''}`}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservas.map(reserva => {
                const usuario = usuarios.find(u => u.id === reserva.usuarioId);
                return (
                  <tr key={reserva.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-bold text-cosmic-base">#{reserva.id}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-flame-light to-cosmic-light rounded-full flex items-center justify-center text-flame-dark font-semibold">{usuario?.primerNombre?.charAt(0)}{usuario?.primerApellido?.charAt(0)}</div>
                        <div><p className="text-sm font-medium text-gray-900">{usuario?.primerNombre} {usuario?.primerApellido}</p><p className="text-xs text-gray-500">{usuario?.credencial?.correo}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-cosmic-base"/><span className="text-sm text-gray-700">{new Date(reserva.fechaReserva).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${reserva.estado === 'confirmada' ? 'bg-green-100 text-green-800' : reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{reserva.estado}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {reserva.viajeId      && <span className="p-2 bg-blue-100 text-blue-600 rounded-lg" title="Vuelo"><Plane className="w-4 h-4"/></span>}
                        {reserva.alojamientoId && <span className="p-2 bg-green-100 text-green-600 rounded-lg" title="Hotel"><Hotel className="w-4 h-4"/></span>}
                        {reserva.transporteId  && <span className="p-2 bg-purple-100 text-purple-600 rounded-lg" title="Transporte"><Car className="w-4 h-4"/></span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><button onClick={() => onViewDetails(reserva)} className="inline-flex items-center gap-2 px-3 py-2 text-cosmic-base hover:bg-cosmic-light rounded-lg transition-colors"><Eye className="w-4 h-4"/>Ver</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {reservas.length === 0 && <div className="text-center py-16"><Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4"/><p className="text-gray-600 text-lg">No se encontraron reservas</p></div>}
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage}/>}
      </div>
    </div>
  );
}

function EstadisticasSection({ stats, reservas, usuarios }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2"><Activity className="w-6 h-6 text-cosmic-base"/>Estadísticas Detalladas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-cosmic-light to-astronaut-light rounded-xl"><h3 className="text-sm font-medium text-gray-700 mb-2">Tasa de Conversión</h3><p className="text-3xl font-bold text-cosmic-dark">{stats.totalReservas > 0 ? ((stats.reservasConfirmadas / stats.totalReservas) * 100).toFixed(1) : 0}%</p><p className="text-xs text-gray-600 mt-1">Reservas confirmadas/Total</p></div>
          <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl"><h3 className="text-sm font-medium text-gray-700 mb-2">Ingresos Promedio</h3><p className="text-3xl font-bold text-green-700">${stats.reservasConfirmadas > 0 ? (stats.ingresosTotales / stats.reservasConfirmadas).toFixed(2) : 0}</p><p className="text-xs text-gray-600 mt-1">Por reserva confirmada</p></div>
          <div className="p-6 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl"><h3 className="text-sm font-medium text-gray-700 mb-2">Usuarios por Admin</h3><p className="text-3xl font-bold text-orange-700">{stats.administradores > 0 ? (stats.totalUsuarios / stats.administradores).toFixed(1) : stats.totalUsuarios}</p><p className="text-xs text-gray-600 mt-1">Ratio usuario/administrador</p></div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, setCurrentPage }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-600">Página {currentPage} de {totalPages}</p>
      <div className="flex gap-2">
        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Anterior</button>
        <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Siguiente</button>
      </div>
    </div>
  );
}

// ── Modales ───────────────────────────────────────────────────────────────────
function ModalBase({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon className="w-6 h-6 text-cosmic-base"/>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditUserModal({ user, editForm, setEditForm, onSave, onClose }) {
  return (
    <ModalBase title="Editar Usuario" icon={Edit2} onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[['primerNombre','Primer Nombre *','Juan'],['segundoNombre','Segundo Nombre','Carlos'],['primerApellido','Primer Apellido *','Pérez'],['segundoApellido','Segundo Apellido','González'],['telefono','Teléfono *','+57 300 123 4567']].map(([key, label, ph]) => (
          <div key={key}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" value={editForm[key]} onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent" placeholder={ph}/></div>
        ))}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad *</label><select value={editForm.nacionalidad} onChange={e => setEditForm(prev => ({ ...prev, nacionalidad: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent"><option value="">Selecciona...</option>{['Colombia','Mexico','Argentina','Ecuador','Peru','Chile','Bolivia','Panama','Costa_rica','Nicaragua','Honduras','Guatemala','Uruguay','Paraguay'].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancelar</button>
        <button onClick={onSave}  className="flex-1 px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors font-medium">Guardar Cambios</button>
      </div>
    </ModalBase>
  );
}

function PromoteModal({ user, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6"><div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-8 h-8 text-purple-600"/></div><h3 className="text-xl font-bold text-gray-900 mb-2">Promover a Administrador</h3><p className="text-gray-600">¿Seguro que deseas promover a <strong>{user?.primerNombre} {user?.primerApellido}</strong>?</p></div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6"><p className="text-sm text-purple-900 font-medium mb-2">Esta acción otorgará permisos completos de administrador</p></div>
        <div className="flex gap-3"><button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancelar</button><button onClick={onConfirm} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">Confirmar</button></div>
      </div>
    </div>
  );
}

function DemoteModal({ user, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6"><div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldOff className="w-8 h-8 text-orange-600"/></div><h3 className="text-xl font-bold text-gray-900 mb-2">Degradar a Usuario Regular</h3><p className="text-gray-600">¿Seguro que deseas degradar a <strong>{user?.primerNombre} {user?.primerApellido}</strong>?</p></div>
        <div className="flex gap-3"><button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancelar</button><button onClick={onConfirm} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">Confirmar</button></div>
      </div>
    </div>
  );
}

function DeleteModal({ user, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8 text-red-600"/></div><h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar Usuario</h3><p className="text-gray-600">¿Seguro que deseas eliminar a <strong>{user?.primerNombre} {user?.primerApellido}</strong>?</p></div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"><p className="text-sm text-red-900 font-bold">Esta acción NO se puede deshacer</p></div>
        <div className="flex gap-3"><button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancelar</button><button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Eliminar Permanentemente</button></div>
      </div>
    </div>
  );
}

function CreateAdminModal({ form, setForm, onSubmit, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <ModalBase title="Crear Nuevo Administrador" icon={UserPlus} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['primerNombre','Primer Nombre *','Juan'],['primerApellido','Primer Apellido *','Pérez'],['cargo','Cargo *','Gerente de Operaciones'],['telefono','Teléfono','+57 300 123 4567']].map(([key,label,ph]) => (
            <div key={key}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} required={label.includes('*')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent" placeholder={ph}/></div>
          ))}
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.correo} onChange={e => setForm(prev => ({ ...prev, correo: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent" placeholder="admin@travelgo.com"/></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={form.contrasena} onChange={e => setForm(prev => ({ ...prev, contrasena: e.target.value }))} required minLength={6} className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmic-base focus:border-transparent" placeholder="Mínimo 6 caracteres"/><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700">{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button></div></div>
        </div>
        <div className="flex gap-3 mt-6"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancelar</button><button type="submit" className="flex-1 px-4 py-2 bg-flame-base text-white rounded-lg hover:bg-flame-dark transition-colors font-medium">Crear Administrador</button></div>
      </form>
    </ModalBase>
  );
}

function UserDetailsModal({ user, reservas, onClose }) {
  return (
    <ModalBase title="Detalles del Usuario" icon={Info} onClose={onClose}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-cosmic-light to-astronaut-light rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-cosmic-base to-astronaut-base rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">{user?.primerNombre?.charAt(0)}{user?.primerApellido?.charAt(0)}</div>
            <div><h4 className="text-2xl font-bold text-gray-900">{user?.primerNombre} {user?.primerApellido}</h4><div className="flex gap-2 mt-2"><RoleBadge role={user?.credencial?.tipoUsuario}/><StatusBadge status={user?.credencial?.estaActivo}/></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-cosmic-base"/><span className="text-gray-700">{user?.credencial?.correo}</span></div>
            <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-cosmic-base"/><span className="text-gray-700">{user?.telefono || 'N/A'}</span></div>
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-cosmic-base"/><span className="text-gray-700">{user?.nacionalidad || 'N/A'}</span></div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-cosmic-base"/><span className="text-gray-700">{user?.fechaNacimiento || 'N/A'}</span></div>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Ticket className="w-5 h-5 text-cosmic-base"/>Reservas ({reservas.length})</h4>
          {reservas.length > 0 ? (
            <div className="space-y-3">
              {reservas.map(r => (
                <div key={r.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div><p className="font-semibold text-gray-900">Reserva #{r.id}</p><p className="text-sm text-gray-600">{new Date(r.fechaReserva).toLocaleDateString('es-ES')}</p></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.estado === 'confirmada' ? 'bg-green-100 text-green-800' : r.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{r.estado}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {r.viajeId      && <span className="p-1 bg-blue-100 text-blue-600 rounded text-xs">Vuelo</span>}
                    {r.alojamientoId && <span className="p-1 bg-green-100 text-green-600 rounded text-xs">Hotel</span>}
                    {r.transporteId  && <span className="p-1 bg-purple-100 text-purple-600 rounded text-xs">Transporte</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-center py-8">No hay reservas registradas</p>}
        </div>
      </div>
      <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors font-medium">Cerrar</button>
    </ModalBase>
  );
}

function ReservaDetailsModal({ reserva, usuario, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Ticket className="w-6 h-6 text-cosmic-base"/>Detalles de Reserva #{reserva?.id}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button></div>
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Cliente</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cosmic-base to-astronaut-base rounded-full flex items-center justify-center text-white font-bold">{usuario?.primerNombre?.charAt(0)}{usuario?.primerApellido?.charAt(0)}</div>
              <div><p className="font-medium text-gray-900">{usuario?.primerNombre} {usuario?.primerApellido}</p><p className="text-sm text-gray-600">{usuario?.credencial?.correo}</p></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Fecha de Reserva</p><p className="font-semibold text-gray-900">{new Date(reserva?.fechaReserva).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
            <div className="bg-green-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Estado</p><span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${reserva?.estado === 'confirmada' ? 'bg-green-200 text-green-900' : reserva?.estado === 'pendiente' ? 'bg-yellow-200 text-yellow-900' : 'bg-red-200 text-red-900'}`}>{reserva?.estado}</span></div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Servicios Incluidos</h4>
            <div className="grid grid-cols-3 gap-3">
              {reserva?.viajeId      && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"><Plane className="w-8 h-8 text-blue-600 mx-auto mb-2"/><p className="text-sm font-medium text-blue-900">Vuelo</p><p className="text-xs text-blue-700">ID: {reserva.viajeId}</p></div>}
              {reserva?.alojamientoId && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"><Hotel className="w-8 h-8 text-green-600 mx-auto mb-2"/><p className="text-sm font-medium text-green-900">Hotel</p><p className="text-xs text-green-700">ID: {reserva.alojamientoId}</p></div>}
              {reserva?.transporteId  && <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center"><Car className="w-8 h-8 text-purple-600 mx-auto mb-2"/><p className="text-sm font-medium text-purple-900">Transporte</p><p className="text-xs text-purple-700">ID: {reserva.transporteId}</p></div>}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors font-medium">Cerrar</button>
      </div>
    </div>
  );
}