import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingStorage } from '../../utils/bookingStorage';
import BookingModal from '../booking/BookingModal';
import { API } from '../../config/api';

function SearchCard() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
  });

  const [originCode, setOriginCode] = useState('');
  const [destinationCode, setDestinationCode] = useState('');

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);

  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (originRef.current && !originRef.current.contains(event.target)) setShowOriginSuggestions(false);
      if (destinationRef.current && !destinationRef.current.contains(event.target)) setShowDestinationSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (keyword, isOrigin) => {
    if (!keyword || keyword.length < 2) {
      if (isOrigin) { setOriginSuggestions([]); setShowOriginSuggestions(false); }
      else { setDestinationSuggestions([]); setShowDestinationSuggestions(false); }
      return;
    }
    try {
      if (isOrigin) setSearchingOrigin(true);
      else setSearchingDestination(true);

      // CORREGIDO: usa API.flights en lugar de URL hardcodeada
      const response = await fetch(`${API.flights}/locations?keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();
      if (data.status === 'SUCCESS' && data.data) {
        const locations = data.data.map(loc => ({
          iataCode: loc.iataCode,
          name: loc.name,
          address: loc.address?.cityName || loc.address?.countryName || '',
          displayName: `${loc.name} (${loc.iataCode}) - ${loc.address?.cityName || loc.address?.countryName || ''}`,
        }));
        if (isOrigin) { setOriginSuggestions(locations); setShowOriginSuggestions(locations.length > 0); }
        else { setDestinationSuggestions(locations); setShowDestinationSuggestions(locations.length > 0); }
      }
    } catch (err) {
      console.error('Error buscando ubicaciones:', err);
    } finally {
      if (isOrigin) setSearchingOrigin(false);
      else setSearchingDestination(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (formData.origin && !originCode) searchLocations(formData.origin, true); }, 300);
    return () => clearTimeout(timer);
  }, [formData.origin]);

  useEffect(() => {
    const timer = setTimeout(() => { if (formData.destination && !destinationCode) searchLocations(formData.destination, false); }, 300);
    return () => clearTimeout(timer);
  }, [formData.destination]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'origin') setOriginCode('');
    else if (name === 'destination') setDestinationCode('');
  };

  const selectLocation = (location, isOrigin) => {
    if (isOrigin) {
      setFormData(prev => ({ ...prev, origin: location.displayName }));
      setOriginCode(location.iataCode);
      setShowOriginSuggestions(false);
      setOriginSuggestions([]);
    } else {
      setFormData(prev => ({ ...prev, destination: location.displayName }));
      setDestinationCode(location.iataCode);
      setShowDestinationSuggestions(false);
      setDestinationSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalOriginCode = originCode;
      let finalDestinationCode = destinationCode;

      if (!originCode && formData.origin.length === 3) finalOriginCode = formData.origin.toUpperCase();
      if (!destinationCode && formData.destination.length === 3) finalDestinationCode = formData.destination.toUpperCase();

      if (!finalOriginCode || !finalDestinationCode) {
        throw new Error('Por favor selecciona una ciudad válida de las sugerencias o ingresa un código IATA de 3 letras');
      }

      const queryParams = new URLSearchParams({
        origin: finalOriginCode,
        destination: finalDestinationCode,
        departure: formData.departureDate,
        adults: formData.adults,
        max: 10,
      });
      if (formData.returnDate?.trim()) queryParams.append('returnDate', formData.returnDate);

      // CORREGIDO: usa API.flights en lugar de URL hardcodeada
      const response = await fetch(`${API.flights}/search?${queryParams}`);

      if (!response.ok) {
        if (response.status === 403) throw new Error('Acceso denegado. Verifica la configuración de seguridad.');
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === 'SUCCESS') {
        setResults(data.data || []);
      } else {
        throw new Error(data.error || 'Error desconocido en la búsqueda');
      }
    } catch (err) {
      console.error('❌ Error al buscar vuelos:', err);
      setError(err.message || 'Error al buscar vuelos');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = (flight) => {
    if (bookingInProgress) return;
    setBookingInProgress(true);

    try {
      const bookingData = {
        selectedFlight: flight,
        searchData: {
          origin: originCode || formData.origin,
          destination: destinationCode || formData.destination,
          departureDate: formData.departureDate,
          returnDate: formData.returnDate || null,
          adults: formData.adults,
        },
        currentStep: 1,
        timestamp: new Date().toISOString(),
      };

      const token = localStorage.getItem('token');

      if (!token) {
        const saved = bookingStorage.save(bookingData);
        if (saved) {
          setPendingBooking(bookingData);
          setShowModal(true);
        } else {
          setError('Error al preparar la reserva');
        }
        setTimeout(() => setBookingInProgress(false), 500);
      } else {
        bookingStorage.save(bookingData);
        navigate('/booking');
        setTimeout(() => setBookingInProgress(false), 1000);
      }
    } catch (err) {
      console.error('❌ Error en handleReservation:', err);
      setError('Error al procesar la reserva');
      setBookingInProgress(false);
    }
  };

  return (
    <div>
      <BookingModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setPendingBooking(null); }}
        bookingData={pendingBooking}
      />

      {/* HERO */}
      <section className="relative h-[80vh] flex items-center justify-center text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1499678329028-101435549a4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-astronaut-dark/60 to-cosmic-dark/60"/>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
            Descubre el mundo con{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cosmic-light to-flame-light">
              Travel Go
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 drop-shadow-md">
            Encuentra las mejores ofertas en viajes, paquetes y experiencias únicas.
          </p>
        </div>
      </section>

      {/* SEARCH */}
      <section id="search-section" className="container mx-auto px-4 -mt-16 mb-5">
        <div className="search-card p-6 md:p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-astronaut-dark mb-6">Encuentra tu viaje perfecto</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Origen */}
            <div ref={originRef} className="relative">
              <label htmlFor="origin" className="block text-astronaut-dark font-medium mb-2">Origen</label>
              <div className="relative">
                <i className="fas fa-plane-departure absolute left-3 top-3 text-cosmic-base z-10"></i>
                <input
                  type="text" id="origin" name="origin"
                  placeholder="Madrid, Barcelona, ATH..."
                  value={formData.origin} onChange={handleChange}
                  onFocus={() => formData.origin && setShowOriginSuggestions(true)}
                  required autoComplete="off"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-base"
                />
                {searchingOrigin && <i className="fas fa-spinner fa-spin absolute right-3 top-3 text-cosmic-base"></i>}
              </div>
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {originSuggestions.map((loc, i) => (
                    <div key={`${loc.iataCode}-${i}`} onClick={() => selectLocation(loc, true)}
                      className="px-4 py-3 hover:bg-cosmic-light cursor-pointer border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <i className="fas fa-map-marker-alt text-cosmic-base mr-3"></i>
                        <div>
                          <p className="font-semibold text-astronaut-dark">{loc.name}</p>
                          <p className="text-sm text-gray-500">{loc.iataCode} - {loc.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destino */}
            <div ref={destinationRef} className="relative">
              <label htmlFor="destination" className="block text-astronaut-dark font-medium mb-2">Destino</label>
              <div className="relative">
                <i className="fas fa-plane-arrival absolute left-3 top-3 text-cosmic-base z-10"></i>
                <input
                  type="text" id="destination" name="destination"
                  placeholder="Athens, London, BCN..."
                  value={formData.destination} onChange={handleChange}
                  onFocus={() => formData.destination && setShowDestinationSuggestions(true)}
                  required autoComplete="off"
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-base"
                />
                {searchingDestination && <i className="fas fa-spinner fa-spin absolute right-3 top-3 text-cosmic-base"></i>}
              </div>
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {destinationSuggestions.map((loc, i) => (
                    <div key={`${loc.iataCode}-${i}`} onClick={() => selectLocation(loc, false)}
                      className="px-4 py-3 hover:bg-cosmic-light cursor-pointer border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <i className="fas fa-map-marker-alt text-cosmic-base mr-3"></i>
                        <div>
                          <p className="font-semibold text-astronaut-dark">{loc.name}</p>
                          <p className="text-sm text-gray-500">{loc.iataCode} - {loc.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fecha salida */}
            <div>
              <label htmlFor="departureDate" className="block text-astronaut-dark font-medium mb-2">Fecha de salida</label>
              <div className="relative">
                <i className="fas fa-calendar absolute left-3 top-3 text-cosmic-base"></i>
                <input type="date" id="departureDate" name="departureDate"
                  value={formData.departureDate} onChange={handleChange} required
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-base"/>
              </div>
            </div>

            {/* Fecha regreso */}
            <div>
              <label htmlFor="returnDate" className="block text-astronaut-dark font-medium mb-2">Fecha de regreso (opcional)</label>
              <div className="relative">
                <i className="fas fa-calendar-alt absolute left-3 top-3 text-cosmic-base"></i>
                <input type="date" id="returnDate" name="returnDate"
                  value={formData.returnDate} onChange={handleChange}
                  min={formData.departureDate || new Date().toISOString().split('T')[0]}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-base"/>
              </div>
            </div>

            {/* Personas */}
            <div>
              <label htmlFor="adults" className="block text-astronaut-dark font-medium mb-2">Personas</label>
              <div className="relative">
                <i className="fas fa-user absolute left-3 top-3 text-cosmic-base"></i>
                <select id="adults" name="adults" value={formData.adults} onChange={handleChange}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-base">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <option key={n} value={n}>{n} persona{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón */}
            <div className="md:col-span-2 lg:col-span-4 flex justify-center mt-4">
              <button type="submit" disabled={loading}
                className="btn-primary px-8 py-3 rounded-lg font-medium w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform transition-all duration-300">
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-search'} mr-2`}></i>
                {loading ? 'Buscando...' : 'Buscar vuelos'}
              </button>
            </div>
          </form>

          {(originCode || destinationCode) && (
            <div className="mt-4 p-3 bg-cosmic-light/30 rounded-lg border border-cosmic-base/30">
              <p className="text-sm text-astronaut-dark">
                <i className="fas fa-info-circle mr-2 text-cosmic-base"></i>
                Buscando:
                {originCode && <span className="font-semibold ml-1">{originCode}</span>}
                {originCode && destinationCode && <i className="fas fa-arrow-right mx-2 text-cosmic-base"></i>}
                {destinationCode && <span className="font-semibold">{destinationCode}</span>}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="container mx-auto px-4 mt-10 mb-16">
        <h3 className="text-2xl font-bold mb-6 text-astronaut-dark">
          {results.length > 0 ? `${results.length} vuelos encontrados` : 'Resultados:'}
        </h3>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cosmic-base"></div>
            <p className="mt-4 text-gray-600 text-lg">Buscando los mejores vuelos para ti...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-start">
            <i className="fas fa-exclamation-circle text-2xl mr-3 mt-1"></i>
            <div>
              <p className="font-semibold text-lg mb-1">Error en la búsqueda</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {results.length > 0 && !loading && (
          <div className="grid gap-6">
            {results.map((flight, index) => (
              <div key={flight.id || index}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-cosmic-base transform hover:scale-[1.02]">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-astronaut-light to-cosmic-light rounded-full flex items-center justify-center">
                          <i className="fas fa-plane text-astronaut-base text-xl"></i>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-astronaut-dark">
                            {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || 'N/A'}
                            <i className="fas fa-arrow-right mx-2 text-cosmic-base"></i>
                            {flight.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || 'N/A'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {flight.itineraries?.[0]?.segments?.[0]?.carrierCode || ''}{' '}
                            {flight.itineraries?.[0]?.segments?.[0]?.number || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-calendar text-cosmic-base"></i>
                        <div>
                          <p className="text-xs text-gray-500">Salida</p>
                          <p className="text-sm font-medium">
                            {flight.itineraries?.[0]?.segments?.[0]?.departure?.at
                              ? new Date(flight.itineraries[0].segments[0].departure.at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-clock text-cosmic-base"></i>
                        <div>
                          <p className="text-xs text-gray-500">Duración</p>
                          <p className="text-sm font-medium">
                            {flight.itineraries?.[0]?.duration
                              ? flight.itineraries[0].duration.replace('PT','').replace('H','h ').replace('M','m')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-users text-cosmic-base"></i>
                        <div>
                          <p className="text-xs text-gray-500">Asientos</p>
                          <p className="text-sm font-medium">{flight.numberOfBookableSeats || 'Consultar'}</p>
                        </div>
                      </div>
                    </div>

                    {flight.itineraries?.[0]?.segments && (
                      <div className="border-t pt-3">
                        <p className="text-xs text-gray-500 mt-2">
                          {flight.itineraries[0].segments.length > 1
                            ? `${flight.itineraries[0].segments.length - 1} escala(s)`
                            : 'Vuelo directo'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-3 min-w-[200px] lg:min-w-[220px]">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Precio total</p>
                      <p className="text-3xl font-bold text-cosmic-base">
                        {flight.price?.total ? parseFloat(flight.price.total).toFixed(2) : 'N/A'}
                      </p>
                      <p className="text-lg text-gray-500">{flight.price?.currency || 'USD'}</p>
                    </div>

                    <button
                      onClick={() => handleReservation(flight)}
                      className="w-full bg-gradient-to-r from-flame-base to-flame-dark hover:from-flame-dark hover:to-cosmic-dark text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2">
                      <i className="fas fa-ticket-alt"></i>
                      <span>Reservar Ahora</span>
                    </button>

                    {flight.numberOfBookableSeats && flight.numberOfBookableSeats <= 5 && (
                      <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded text-center">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        ¡Solo {flight.numberOfBookableSeats} asientos!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-lg">
              No hay resultados aún. Realiza una búsqueda para ver vuelos disponibles.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default SearchCard;