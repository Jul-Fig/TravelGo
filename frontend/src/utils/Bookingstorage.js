// src/utils/bookingStorage.js
// Utilidad para manejar el almacenamiento temporal de reservas CON DEBOUNCING

const BOOKING_KEY = 'pendingBooking';
const BOOKING_EXPIRY = 30 * 60 * 1000; 

let saveTimeout = null; 

const bookingStorage = {
  /**
   * ✅ Guardar con DEBOUNCING (previene múltiples guardados)
   */
  save: (bookingData) => {
    try {
      // ⚡ Cancelar guardado anterior si existe
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        console.log('⏳ Cancelando guardado anterior...');
      }
      
      // ⚡ Guardar después de 100ms (si no hay más llamadas)
      saveTimeout = setTimeout(() => {
        const data = {
          ...bookingData,
          timestamp: Date.now(),
          expiresAt: Date.now() + BOOKING_EXPIRY,
        };
        
        localStorage.setItem(BOOKING_KEY, JSON.stringify(data));
        console.log('💾 Reserva guardada en localStorage:', {
          hasFlight: !!data.selectedFlight,
          hasHotel: !!data.selectedHotel,
          hasTransport: !!data.selectedTransport,
          step: data.currentStep
        });
        
        saveTimeout = null;
      }, 100);
      
      return true;
    } catch (error) {
      console.error(' Error guardando reserva:', error);
      return false;
    }
  },

  /**
   *  Guardar INMEDIATAMENTE (sin debouncing) - usar solo cuando es crítico
   */
  saveNow: (bookingData) => {
    try {

      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      
      const data = {
        ...bookingData,
        timestamp: Date.now(),
        expiresAt: Date.now() + BOOKING_EXPIRY,
      };
      
      localStorage.setItem(BOOKING_KEY, JSON.stringify(data));
      console.log('💾 Reserva guardada INMEDIATAMENTE');
      return true;
    } catch (error) {
      console.error('❌ Error guardando reserva:', error);
      return false;
    }
  },

  get: () => {
    try {
      const stored = localStorage.getItem(BOOKING_KEY);
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored);

      // Verificar si expiró
      if (data.expiresAt && Date.now() > data.expiresAt) {
        console.log('⏰ Reserva expirada');
        bookingStorage.clear();
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Error recuperando reserva:', error);
      return null;
    }
  },

  clear: () => {
    try {
      
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      
      localStorage.removeItem(BOOKING_KEY);
      console.log('🗑️ Reserva limpiada');
      return true;
    } catch (error) {
      console.error('❌ Error limpiando reserva:', error);
      return false;
    }
  },

  update(updates) {
    const current = this.get();
    if (!current) return false;
    return this.save({ ...current, ...updates });
  },

   updateStep(newStep) {
    const current = this.get();
    if (!current) return false;
    return this.save({ ...current, currentStep: newStep });
  },

  hasPendingBooking: () => {
    try {
      const data = bookingStorage.get();
      if (!data) return false;
      const hasSelected =
        !!data.selectedFlight || !!data.selectedHotel || !!data.selectedTransport;
      const notExpired = !(data.expiresAt && Date.now() > data.expiresAt);
      return hasSelected && notExpired;
    } catch (err) {
      console.warn('Error en hasPendingBooking:', err);
      return false;
    }
  },

  getSummary: () => {
    try {
      const data = bookingStorage.get();
      if (!data) return null;

      return {
        hasFlight: !!data.selectedFlight,
        hasHotel: !!data.selectedHotel,
        hasTransport: !!data.selectedTransport,
        currentStep: data.currentStep || 1,
        destination: data.searchData?.destination || 'N/A',
        origin: data.searchData?.origin || 'N/A',
        departureDate: data.searchData?.departureDate || 'N/A',
        returnDate: data.searchData?.returnDate || null,
        adults: data.searchData?.adults ?? 1,
        raw: data,
      };
    } catch (err) {
      console.error('❌ Error generando resumen:', err);
      return null;
    }
  },
};

export { bookingStorage };
export default bookingStorage;