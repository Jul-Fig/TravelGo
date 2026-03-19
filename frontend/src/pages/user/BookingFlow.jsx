import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingStorage } from '../../utils/bookingStorage';
import { API } from '../../config/api';
import BookingWizard from '../../components/booking/BookingWizard';
import FlightCard from '../../components/booking/FlightCard';
import HotelCard from '../../components/booking/HotelCard';
import TransportCard from '../../components/booking/TransportCard';
import BookingSummary from '../../components/booking/BookingSummary';
import PaymentForm from '../../components/booking/PaymentForm';
import {
  Plane, Hotel, Car, CreditCard, ArrowLeft,
  AlertCircle, CheckCircle2, Loader2, Home,
} from 'lucide-react';

export default function BookingFlow() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchData, setSearchData] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);

  const [availableHotels, setAvailableHotels] = useState([]);
  const [availableTransports, setAvailableTransports] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingTransports, setLoadingTransports] = useState(false);

  useEffect(() => { loadBookingData(); }, []);

  // ── Cargar datos de reserva guardada ─────────────────────────────────────
  const loadBookingData = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: 'booking' }, replace: true });
        return;
      }

      const savedBooking = bookingStorage.get();

      if (savedBooking?.selectedFlight) {
        setSelectedFlight(savedBooking.selectedFlight);
        setSearchData(savedBooking.searchData || {});
        setSelectedHotel(savedBooking.selectedHotel || null);
        setSelectedTransport(savedBooking.selectedTransport || null);
        setCurrentStep(savedBooking.currentStep || 1);
      } else if (location.state?.selectedFlight) {
        setSelectedFlight(location.state.selectedFlight);
        setSearchData(location.state.searchData || {});
        bookingStorage.save({
          selectedFlight: location.state.selectedFlight,
          searchData: location.state.searchData,
          currentStep: 1,
        });
      } else {
        setError('No hay reserva pendiente. Serás redirigido al inicio.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }
    } catch (err) {
      setError('Error al cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  // ── Buscar hoteles ────────────────────────────────────────────────────────
  const loadHotels = async () => {
    if (!searchData?.destination) { setError('No se puede buscar hoteles sin destino'); return; }
    setLoadingHotels(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // CORREGIDO: usa API.hotels
      const response = await fetch(`${API.hotels}/search?cityCode=${searchData.destination}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (response.status === 401) { localStorage.clear(); navigate('/login', { state: { from: 'booking', expired: true }, replace: true }); return; }
      if (!response.ok) throw new Error('Error al buscar hoteles');
      const data = await response.json();
      setAvailableHotels(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError('No se pudieron cargar los hoteles');
      setAvailableHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  };

  // ── Buscar transportes ────────────────────────────────────────────────────
  const loadTransports = async () => {
    setLoadingTransports(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // CORREGIDO: usa API.transporte
      const response = await fetch(`${API.transporte}/por-tipo?tipo=Transfer`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (response.status === 401) { localStorage.clear(); navigate('/login', { state: { from: 'booking', expired: true }, replace: true }); return; }
      if (!response.ok) throw new Error('Error al buscar transporte');
      const data = await response.json();
      setAvailableTransports(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError('No se pudieron cargar las opciones de transporte');
      setAvailableTransports([]);
    } finally {
      setLoadingTransports(false);
    }
  };

  // ── Seleccionar / remover hotel ───────────────────────────────────────────
  const handleSelectHotel = (hotel) => {
    setSelectedHotel(hotel);
    const current = bookingStorage.get() || {};
    bookingStorage.save({ ...current, selectedHotel: hotel });
    setSuccess('Hotel agregado');
    setTimeout(() => setSuccess(''), 3000);
  };
  const handleRemoveHotel = () => {
    setSelectedHotel(null);
    const current = bookingStorage.get() || {};
    const { selectedHotel: _, ...rest } = current;
    bookingStorage.save(rest);
  };

  // ── Seleccionar / remover transporte ─────────────────────────────────────
  const handleSelectTransport = (transport) => {
    setSelectedTransport(transport);
    const current = bookingStorage.get() || {};
    bookingStorage.save({ ...current, selectedTransport: transport });
    setSuccess('Transporte agregado');
    setTimeout(() => setSuccess(''), 3000);
  };
  const handleRemoveTransport = () => {
    setSelectedTransport(null);
    const current = bookingStorage.get() || {};
    const { selectedTransport: _, ...rest } = current;
    bookingStorage.save(rest);
  };

  // ── Ir al pago ────────────────────────────────────────────────────────────
  const handleProceedToPayment = () => {
    if (!selectedFlight) { setError('Debes seleccionar un vuelo'); return; }
    setCurrentStep(4);
    bookingStorage.updateStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Procesar pago ─────────────────────────────────────────────────────────
  const handlePayment = async (paymentData) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay sesión activa');

      // Resolver IDs locales válidos
      let hotelIdLocal = null;
      if (selectedHotel?.id && Number.isInteger(selectedHotel.id)) hotelIdLocal = selectedHotel.id;

      let transporteIdLocal = null;
      if (selectedTransport?.id && Number.isInteger(selectedTransport.id)) transporteIdLocal = selectedTransport.id;

      const completeBookingData = {
        flightData: { id: selectedFlight.id, ...selectedFlight },
        searchData: {
          origin: searchData.origin,
          destination: searchData.destination,
          departureDate: searchData.departureDate,
          returnDate: searchData.returnDate || null,
          adults: searchData.adults || 1,
        },
        alojamientoId: hotelIdLocal,
        transporteId: transporteIdLocal,
        paymentData: {
          metodoPago: paymentData.metodoPago,
          ...(paymentData.metodoPago === 'Tarjeta' && {
            numeroTarjeta: paymentData.numeroTarjeta,
            nombreTitular: paymentData.nombreTitular,
            fechaExpiracion: paymentData.fechaExpiracion,
            cvv: paymentData.cvv,
          }),
          ...(paymentData.metodoPago === 'PSE' && {
            banco: paymentData.banco,
            tipoPersona: paymentData.tipoPersona,
            tipoDocumento: paymentData.tipoDocumento,
            numeroDocumento: paymentData.numeroDocumento,
          }),
          ...(paymentData.metodoPago === 'Nequi' && { numeroNequi: paymentData.numeroNequi }),
        },
      };

      // CORREGIDO: usa API.bookings
      const response = await fetch(`${API.bookings}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(completeBookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) { localStorage.clear(); navigate('/login', { state: { from: 'booking', expired: true }, replace: true }); return; }
        throw new Error(errorData.error || errorData.message || 'Error al procesar la reserva');
      }

      const result = await response.json();
      const confirmationNumber = result.confirmationNumber || `TG-${result.reservaId}`;

      bookingStorage.clear();
      setSuccess(`Reserva confirmada! Número: ${confirmationNumber}`);

      setTimeout(() => {
        navigate('/UserProfile', {
          state: { bookingSuccess: true, confirmationNumber, reservaId: result.reservaId, activeTab: 'reservas' },
          replace: true,
        });
      }, 2000);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-astronaut-light to-cosmic-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cosmic-base animate-spin mx-auto mb-4"/>
          <p className="text-gray-700 text-lg font-medium">Cargando tu reserva...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-astronaut-light to-cosmic-light">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-cosmic-base hover:text-cosmic-dark transition-colors">
              <ArrowLeft className="w-5 h-5"/>
              <span className="font-medium">Volver al inicio</span>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-astronaut-dark">Completa tu Reserva</h1>
            <button onClick={() => navigate('/UserProfile')}
              className="flex items-center gap-2 px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors">
              <Home className="w-5 h-5"/>
              <span className="hidden md:inline">Mi Perfil</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-6">
        <BookingWizard currentStep={currentStep} onStepChange={setCurrentStep}/>
      </div>

      {/* Mensajes */}
      <div className="container mx-auto px-4 mt-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
            <p className="text-red-800 font-medium flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-500 text-xl leading-none">×</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"/>
            <p className="text-green-800 font-medium flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-500 text-xl leading-none">×</button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {currentStep < 4 && (
              <>
                {/* Vuelo seleccionado */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-astronaut-dark flex items-center gap-2">
                      <Plane className="w-6 h-6 text-cosmic-base"/> Tu Vuelo
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">✓ Seleccionado</span>
                  </div>
                  {selectedFlight && <FlightCard flight={selectedFlight} onSelect={() => {}} isSelected={true}/>}
                </div>

                {/* Hotel */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-astronaut-dark flex items-center gap-2">
                      <Hotel className="w-6 h-6 text-cosmic-base"/> Hotel <span className="text-sm font-normal text-gray-500">(Opcional)</span>
                    </h2>
                    {selectedHotel ? (
                      <button onClick={handleRemoveHotel} className="text-red-600 text-sm">Remover</button>
                    ) : (
                      <button onClick={loadHotels} disabled={loadingHotels}
                        className="px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark disabled:opacity-50 transition-colors">
                        {loadingHotels ? 'Buscando...' : 'Buscar Hoteles'}
                      </button>
                    )}
                  </div>
                  {selectedHotel ? (
                    <HotelCard hotel={selectedHotel} onSelect={() => {}} isSelected={true}/>
                  ) : availableHotels.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {availableHotels.map((hotel, i) => (
                        <HotelCard key={i} hotel={hotel} onSelect={handleSelectHotel} isSelected={false}/>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Haz clic en "Buscar Hoteles" para ver opciones disponibles</p>
                  )}
                </div>

                {/* Transporte */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-astronaut-dark flex items-center gap-2">
                      <Car className="w-6 h-6 text-cosmic-base"/> Transporte <span className="text-sm font-normal text-gray-500">(Opcional)</span>
                    </h2>
                    {selectedTransport ? (
                      <button onClick={handleRemoveTransport} className="text-red-600 text-sm">Remover</button>
                    ) : (
                      <button onClick={loadTransports} disabled={loadingTransports}
                        className="px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark disabled:opacity-50 transition-colors">
                        {loadingTransports ? 'Buscando...' : 'Buscar Transporte'}
                      </button>
                    )}
                  </div>
                  {selectedTransport ? (
                    <TransportCard transport={selectedTransport} onSelect={() => {}} isSelected={true}/>
                  ) : availableTransports.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {availableTransports.map((t, i) => (
                        <TransportCard key={i} transport={t} onSelect={handleSelectTransport} isSelected={false}/>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Haz clic en "Buscar Transporte" para ver opciones disponibles</p>
                  )}
                </div>

                <button onClick={handleProceedToPayment}
                  className="w-full bg-gradient-to-r from-flame-base to-flame-dark text-white font-bold py-4 rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                  <CreditCard className="w-6 h-6"/> Continuar al Pago
                </button>
              </>
            )}

            {currentStep === 4 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-astronaut-dark mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-cosmic-base"/> Información de Pago
                </h2>
                <PaymentForm onSubmit={handlePayment} loading={loading}/>
                <button onClick={() => setCurrentStep(3)}
                  className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5"/> Volver
                </button>
              </div>
            )}
          </div>

          {/* Resumen lateral */}
          <div className="lg:col-span-1">
            <BookingSummary
              flight={selectedFlight}
              hotel={selectedHotel}
              transport={selectedTransport}
              searchData={searchData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}