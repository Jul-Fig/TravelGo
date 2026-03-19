import { X, Lock, UserPlus, Plane, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingStorage } from '../../utils/bookingStorage';

export default function BookingModal({ isOpen, onClose, bookingData }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    // No guardar de nuevo — bookingStorage ya tiene los datos
    onClose();
    navigate('/login', { state: { from: 'booking' } });
  };

  const handleRegister = () => {
    // No guardar de nuevo — bookingStorage ya tiene los datos
    onClose();
    navigate('/register', { state: { from: 'booking' } });
  };

  const summary = bookingData ? {
    origin:        bookingData.searchData?.origin        || 'N/A',
    destination:   bookingData.searchData?.destination   || 'N/A',
    departureDate: bookingData.searchData?.departureDate || 'N/A',
    price:         bookingData.selectedFlight?.price?.total    || 'N/A',
    currency:      bookingData.selectedFlight?.price?.currency || 'USD',
  } : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}/>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6"/>
          </button>

          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cosmic-base to-flame-base rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-white"/>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-astronaut-dark mb-2">
              Inicia sesión para continuar
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Necesitas una cuenta para completar tu reserva
            </p>

            {/* Resumen del vuelo seleccionado */}
            {summary && (
              <div className="bg-gradient-to-r from-cosmic-light to-astronaut-light rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <Plane className="w-5 h-5 text-cosmic-base"/>
                  <span className="text-xs font-medium text-cosmic-dark">Vuelo seleccionado</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-lg font-bold text-astronaut-dark">
                      {summary.origin} → {summary.destination}
                    </p>
                    <p className="text-xs text-gray-600">{summary.departureDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cosmic-base">{summary.price}</p>
                    <p className="text-xs text-gray-600">{summary.currency}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info de seguridad */}
            <div className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-blue-800">
                <strong>Tu reserva está segura.</strong> Guardamos los datos por 30 minutos mientras inicias sesión o creas tu cuenta.
              </p>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button onClick={handleLogin}
                className="w-full bg-gradient-to-r from-cosmic-base to-cosmic-dark hover:from-cosmic-dark hover:to-astronaut-dark text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
                <Lock className="w-5 h-5"/>
                <span>Iniciar Sesión</span>
              </button>

              <button onClick={handleRegister}
                className="w-full bg-gradient-to-r from-flame-base to-flame-dark hover:from-flame-dark hover:to-cosmic-dark text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
                <UserPlus className="w-5 h-5"/>
                <span>Crear Cuenta</span>
              </button>

              <button onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200">
                Cancelar
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-6">
              Tus datos están protegidos con encriptación de alta seguridad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}