import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingStorage } from '../../utils/bookingStorage';
import BookingWizard from '../../components/booking/BookingWizard';
import FlightCard from '../../components/booking/FlightCard';
import HotelCard from '../../components/booking/HotelCard';
import TransportCard from '../../components/booking/TransportCard';
import BookingSummary from '../../components/booking/BookingSummary';
import PaymentForm from '../../components/booking/PaymentForm';
import {
  Plane,
  Hotel,
  Car,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Home,
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

  useEffect(() => {
    loadBookingData();
  }, []);

  const loadBookingData = () => {
  console.log('📋 BookingFlow: Cargando datos de reserva...');
  
  try {
    // ✅ Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No hay token, redirigiendo a login');
      navigate('/login', { state: { from: 'booking' }, replace: true });
      return;
    }

    // ✅ PRIORIDAD 1: Leer de localStorage (lo más reciente)
    const savedBooking = bookingStorage.get();
    
    if (savedBooking?.selectedFlight) {
      console.log('✅ Reserva encontrada en localStorage:', savedBooking);
      
      setSelectedFlight(savedBooking.selectedFlight);
      setSearchData(savedBooking.searchData || {});
      setSelectedHotel(savedBooking.selectedHotel || null);
      setSelectedTransport(savedBooking.selectedTransport || null);
      setCurrentStep(savedBooking.currentStep || 1);
      
    } 
    // ✅ PRIORIDAD 2: Si no hay nada en storage, verificar location.state
    else if (location.state?.selectedFlight) {
      console.log('✅ Reserva encontrada en location.state');
      
      setSelectedFlight(location.state.selectedFlight);
      setSearchData(location.state.searchData || {});
      
      
      bookingStorage.save({
        selectedFlight: location.state.selectedFlight,
        searchData: location.state.searchData,
        currentStep: 1,
      });
    } 
    
    else {
      console.error('❌ No hay reserva pendiente');
      setError('No hay reserva pendiente. Serás redirigido al inicio.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    console.log('✅ Datos de reserva cargados correctamente');
    
  } catch (err) {
    console.error('❌ Error al cargar reserva:', err);
    setError('Error al cargar la reserva');
  } finally {
    // ✅ CRÍTICO: SIEMPRE ejecutar esto
    console.log('🏁 Finalizando carga - setLoading(false)');
    setLoading(false);
  }
};

  const loadHotels = async () => {
    if (!searchData?.destination) {
      setError('No se puede buscar hoteles sin destino');
      return;
    }

    setLoadingHotels(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:9090/hotels/search?cityCode=${searchData.destination}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login', { state: { from: 'booking', expired: true }, replace: true });
        return;
      }

      if (!response.ok) throw new Error('Error al buscar hoteles');

      const data = await response.json();
      setAvailableHotels(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar los hoteles');
      setAvailableHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  };

  const loadTransports = async () => {
    if (!searchData?.destination) {
      setError('No se puede buscar transporte sin destino');
      return;
    }

    setLoadingTransports(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:9090/api/transporte/por-tipo?tipo=Transfer`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        navigate('/login', { state: { from: 'booking', expired: true }, replace: true });
        return;
      }

      if (!response.ok) throw new Error('Error al buscar transporte');

      const data = await response.json();
      setAvailableTransports(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar las opciones de transporte');
      setAvailableTransports([]);
    } finally {
      setLoadingTransports(false);
    }
  };

  const handleSelectHotel = (hotel) => {
    setSelectedHotel(hotel);
    const currentBooking = bookingStorage.get() || {};
    bookingStorage.save({ ...currentBooking, selectedHotel: hotel });
    setSuccess('✅ Hotel agregado');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSelectTransport = (transport) => {
    setSelectedTransport(transport);
    const currentBooking = bookingStorage.get() || {};
    bookingStorage.save({ ...currentBooking, selectedTransport: transport });
    setSuccess('✅ Transporte agregado');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRemoveHotel = () => {
    setSelectedHotel(null);
    const currentBooking = bookingStorage.get() || {};
    delete currentBooking.selectedHotel;
    bookingStorage.save(currentBooking);
  };

  const handleRemoveTransport = () => {
    setSelectedTransport(null);
    const currentBooking = bookingStorage.get() || {};
    delete currentBooking.selectedTransport;
    bookingStorage.save(currentBooking);
  };

  const handleProceedToPayment = () => {
    if (!selectedFlight) {
      setError('Debes seleccionar un vuelo');
      return;
    }

    setCurrentStep(4);
    bookingStorage.updateStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePayment = async (paymentData) => {
  setLoading(true);
  setError('');

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    console.log('💳 Procesando reserva completa...');

    // ✅ PASO 1: Si hay hotel de Amadeus, guardarlo primero en BD
    let hotelIdLocal = null;
    if (selectedHotel) {
      // Si el hotel ya tiene ID numérico, usarlo directamente
      if (selectedHotel.id && Number.isInteger(selectedHotel.id)) {
        hotelIdLocal = selectedHotel.id;
      } 
      // Si es hotel de Amadeus (ID alfanumérico), ignorarlo por ahora
      else if (selectedHotel.hotelId && typeof selectedHotel.hotelId === 'string') {
        console.log('⚠️ Hotel de Amadeus detectado, no se guardará en esta versión');
        // Puedes implementar guardado de hotel aquí en el futuro
        hotelIdLocal = null;
      }
    }

    // ✅ PASO 2: Si hay transporte, verificar que tenga ID válido
    let transporteIdLocal = null;
    if (selectedTransport?.id && Number.isInteger(selectedTransport.id)) {
      transporteIdLocal = selectedTransport.id;
    }

    // ✅ PASO 3: Preparar payload para /api/bookings/complete
    const completeBookingData = {
      // Datos del vuelo (obligatorio)
      flightData: {
        id: selectedFlight.id,
        origin: searchData.origin,
        destination: searchData.destination,
        departureDate: searchData.departureDate,
        returnDate: searchData.returnDate || null,
        price: selectedFlight.price,
        itineraries: selectedFlight.itineraries,
        numberOfBookableSeats: selectedFlight.numberOfBookableSeats,
        validatingAirlineCodes: selectedFlight.validatingAirlineCodes,
        ...selectedFlight
      },
      
      // Datos de búsqueda
      searchData: {
        origin: searchData.origin,
        destination: searchData.destination,
        departureDate: searchData.departureDate,
        returnDate: searchData.returnDate || null,
        adults: searchData.adults || 1,
      },
      
      // ✅ IDs validados (solo si son números enteros)
      alojamientoId: hotelIdLocal,
      transporteId: transporteIdLocal,
      
      // Datos de pago
      paymentData: {
        metodoPago: paymentData.metodoPago,
        
        // Si es tarjeta
        ...(paymentData.metodoPago === 'Tarjeta' && {
          numeroTarjeta: paymentData.numeroTarjeta,
          nombreTitular: paymentData.nombreTitular,
          fechaExpiracion: paymentData.fechaExpiracion,
          cvv: paymentData.cvv,
        }),
        
        // Si es PSE
        ...(paymentData.metodoPago === 'PSE' && {
          banco: paymentData.banco,
          tipoPersona: paymentData.tipoPersona,
          tipoDocumento: paymentData.tipoDocumento,
          numeroDocumento: paymentData.numeroDocumento,
        }),
        
        // Si es Nequi
        ...(paymentData.metodoPago === 'Nequi' && {
          numeroNequi: paymentData.numeroNequi,
        }),
      },
    };

    console.log('📦 Payload final:', JSON.stringify(completeBookingData, null, 2));

    // ✅ PASO 4: Enviar al backend
    const response = await fetch('http://localhost:9090/api/bookings/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(completeBookingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del servidor:', errorData);
      
      if (response.status === 401) {
        localStorage.clear();
        navigate('/login', { 
          state: { from: 'booking', expired: true },
          replace: true 
        });
        return;
      }
      
      throw new Error(errorData.error || errorData.message || 'Error al procesar la reserva');
    }

    const result = await response.json();
    console.log('✅ Reserva completada:', result);

    // Extraer datos de respuesta
    const confirmationNumber = result.confirmationNumber || `TG-${result.reservaId}`;
    const reservaId = result.reservaId || result.data?.reservaId;

    // Limpiar storage
    bookingStorage.clear();
    
    setSuccess(`🎉 ¡Reserva confirmada! Número: ${confirmationNumber}`);
    
    // Redirigir al perfil con tab de reservas
    setTimeout(() => {
      navigate('/UserProfile', { 
        state: { 
          bookingSuccess: true,
          confirmationNumber: confirmationNumber,
          reservaId: reservaId,
          activeTab: 'reservas',
        },
        replace: true 
      });
    }, 2000);

  } catch (err) {
    console.error('❌ Error al procesar pago:', err);
    setError(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const calculateTotal = () => {
    let total = 0;
    
    if (selectedFlight?.price?.total) {
      total += parseFloat(selectedFlight.price.total);
    }
    
    if (selectedHotel?.price) {
      total += parseFloat(selectedHotel.price);
    }
    
    if (selectedTransport?.precio) {
      total += parseFloat(selectedTransport.precio);
    }
    
    return total.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-astronaut-light to-cosmic-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cosmic-base animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-medium">Cargando tu reserva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-astronaut-light to-cosmic-light">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-cosmic-base hover:text-cosmic-dark transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Volver al inicio</span>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-astronaut-dark">
              Completa tu Reserva
            </h1>
            <button
              onClick={() => navigate('/UserProfile')}
              className="flex items-center gap-2 px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden md:inline">Mi Perfil</span>
            </button>
          </div>
        </div>
      </header>

      {/* Wizard */}
      <div className="container mx-auto px-4 pt-6">
        <BookingWizard currentStep={currentStep} onStepChange={setCurrentStep} />
      </div>

      {/* Mensajes */}
      <div className="container mx-auto px-4 mt-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-red-500">×</button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-medium">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500">×</button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep < 4 && (
              <>
                {/* Vuelo */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-astronaut-dark flex items-center gap-2">
                      <Plane className="w-6 h-6 text-cosmic-base" />
                      Tu Vuelo
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      ✓ Seleccionado
                    </span>
                  </div>
                  {selectedFlight && (
                    <FlightCard flight={selectedFlight} onSelect={() => {}} isSelected={true} />
                  )}
                </div>

                {/* Hotel */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-astronaut-dark flex items-center gap-2">
                      <Hotel className="w-6 h-6 text-cosmic-base" />
                      Hotel <span className="text-sm font-normal text-gray-500">(Opcional)</span>
                    </h2>
                    {selectedHotel ? (
                      <button onClick={handleRemoveHotel} className="text-red-600 text-sm">
                        Remover
                      </button>
                    ) : (
                      <button
                        onClick={loadHotels}
                        disabled={loadingHotels}
                        className="px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark disabled:opacity-50"
                      >
                        {loadingHotels ? 'Buscando...' : 'Buscar Hoteles'}
                      </button>
                    )}
                  </div>
                  {selectedHotel ? (
                    <HotelCard hotel={selectedHotel} onSelect={() => {}} isSelected={true} />
                  ) : availableHotels.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {availableHotels.map((hotel, i) => (
                        <HotelCard key={i} hotel={hotel} onSelect={handleSelectHotel} isSelected={false} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Haz clic en "Buscar Hoteles"
                    </p>
                  )}
                </div>

                {/* Transporte */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-astronaut-dark flex items-center gap-2">
                      <Car className="w-6 h-6 text-cosmic-base" />
                      Transporte <span className="text-sm font-normal text-gray-500">(Opcional)</span>
                    </h2>
                    {selectedTransport ? (
                      <button onClick={handleRemoveTransport} className="text-red-600 text-sm">
                        Remover
                      </button>
                    ) : (
                      <button
                        onClick={loadTransports}
                        disabled={loadingTransports}
                        className="px-4 py-2 bg-cosmic-base text-white rounded-lg hover:bg-cosmic-dark disabled:opacity-50"
                      >
                        {loadingTransports ? 'Buscando...' : 'Buscar Transporte'}
                      </button>
                    )}
                  </div>
                  {selectedTransport ? (
                    <TransportCard transport={selectedTransport} onSelect={() => {}} isSelected={true} />
                  ) : availableTransports.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {availableTransports.map((t, i) => (
                        <TransportCard key={i} transport={t} onSelect={handleSelectTransport} isSelected={false} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Haz clic en "Buscar Transporte"
                    </p>
                  )}
                </div>

                <button
                  onClick={handleProceedToPayment}
                  className="w-full bg-gradient-to-r from-flame-base to-flame-dark text-white font-bold py-4 rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-6 h-6" />
                  Continuar al Pago
                </button>
              </>
            )}

            {currentStep === 4 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-astronaut-dark mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-cosmic-base" />
                  Información de Pago
                </h2>
                <PaymentForm onSubmit={handlePayment} loading={loading} />
                
                <button
                  onClick={() => setCurrentStep(3)}
                  className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Volver
                </button>
              </div>
            )}
          </div>

          {/* Resumen */}
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