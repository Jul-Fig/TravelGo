package com.travelgo.backend_travelgo.controller;

import com.travelgo.backend_travelgo.model.*;
import com.travelgo.backend_travelgo.repository.*;
import com.travelgo.backend_travelgo.service.EmailService;
import com.travelgo.backend_travelgo.service.PDFService;
import com.travelgo.backend_travelgo.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin("*")
public class CompleteBookingController {
    
    private static final Logger logger = LoggerFactory.getLogger(CompleteBookingController.class);
    
    @Autowired
    private ViajeRepository viajeRepository;
    
    @Autowired
    private ReservaRepository reservaRepository;
    
    @Autowired
    private PagoRepository pagoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PDFService pdfService;
    
    /**
     * Procesar reserva completa con pago
     * POST /api/bookings/complete
     */
    @PostMapping("/complete")
    @Transactional // ✅ CRÍTICO: Asegurar transacción
public ResponseEntity<?> completeBooking(
        @RequestBody Map<String, Object> bookingData,
        @RequestHeader(value = "Authorization", required = false) String authHeader) {
    
    try {
        // ===== VERIFICACIÓN DE TOKEN =====
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Token no proporcionado"));
        }
        
        String token = authHeader.substring(7);
        Integer usuarioId = jwtUtil.extractUsuarioId(token);
        
        if (jwtUtil.isTokenExpired(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Token expirado"));
        }
        
        logger.info("🎫 Procesando reserva completa para usuario: {}", usuarioId);
        
        // ===== 1. OBTENER USUARIO =====
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        logger.info("✅ Usuario encontrado: {} {}", usuario.getPrimerNombre(), usuario.getPrimerApellido());
        
        // ===== 2. EXTRAER DATOS DEL PAYLOAD =====
        Map<String, Object> flightData = (Map<String, Object>) bookingData.get("flightData");
        Map<String, Object> searchData = (Map<String, Object>) bookingData.get("searchData");
        Map<String, Object> paymentData = (Map<String, Object>) bookingData.get("paymentData");
        
        if (flightData == null || searchData == null || paymentData == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Datos incompletos: flightData, searchData o paymentData faltantes"));
        }
        
        // ===== 3. CREAR Y GUARDAR VIAJE CON FLUSH =====
        Viaje viaje = new Viaje();
        viaje.setFlightOfferId((String) flightData.get("id"));
        viaje.setOrigin((String) searchData.get("origin"));
        viaje.setDestinationCode((String) searchData.get("destination"));
        
        // Fechas
        String departureDateStr = (String) searchData.get("departureDate");
        if (departureDateStr != null && !departureDateStr.isEmpty()) {
            viaje.setDepartureDate(LocalDate.parse(departureDateStr));
        }
        
        String returnDateStr = (String) searchData.get("returnDate");
        if (returnDateStr != null && !returnDateStr.isEmpty()) {
            viaje.setReturnDate(LocalDate.parse(returnDateStr));
        }
        
        // Precio
        Map<String, Object> price = (Map<String, Object>) flightData.get("price");
        if (price != null && price.get("total") != null) {
            viaje.setPrecio(new BigDecimal(price.get("total").toString()));
            viaje.setCurrency((String) price.get("currency"));
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Precio del vuelo no encontrado"));
        }
        
        viaje.setTipoViaje("vuelo");
        viaje.setTitulo(viaje.getOrigin() + " → " + viaje.getDestinationCode());
        
        // ✅ GUARDAR CON FLUSH para obtener ID inmediatamente
        viaje = viajeRepository.saveAndFlush(viaje);
        logger.info("✈️ Viaje guardado con ID: {}", viaje.getId());
        
        // ===== 4. CREAR Y GUARDAR RESERVA CON FLUSH =====
        Reserva reserva = new Reserva();
        reserva.setUsuarioId(usuarioId);
        reserva.setViajeId(viaje.getId()); // ✅ Ahora viaje.getId() tiene valor real
        
        // Alojamiento (opcional)
        if (bookingData.get("alojamientoId") != null) {
            try {
                reserva.setAlojamientoId(Integer.parseInt(bookingData.get("alojamientoId").toString()));
                logger.info("🏨 Alojamiento ID: {}", reserva.getAlojamientoId());
            } catch (NumberFormatException e) {
                logger.warn("⚠️ alojamientoId inválido, ignorando");
            }
        }
        
        // Transporte (opcional)
        if (bookingData.get("transporteId") != null) {
            try {
                reserva.setTransporteId(Integer.parseInt(bookingData.get("transporteId").toString()));
                logger.info("🚗 Transporte ID: {}", reserva.getTransporteId());
            } catch (NumberFormatException e) {
                logger.warn("⚠️ transporteId inválido, ignorando");
            }
        }
        
        reserva.setEstado(Reserva.Estado.confirmada);
        
        // ✅ GUARDAR CON FLUSH para obtener ID inmediatamente
        reserva = reservaRepository.saveAndFlush(reserva);
        logger.info("📋 Reserva creada con ID: {}", reserva.getId());
        
        // ===== 5. CREAR Y GUARDAR PAGO =====
        Pago pago = new Pago();
        pago.setReserva(reserva); // ✅ Ahora reserva tiene ID real y está en BD
        pago.setMonto(viaje.getPrecio());
        
        // Método de pago
        String metodoPagoStr = (String) paymentData.get("metodoPago");
        if (metodoPagoStr == null || metodoPagoStr.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Método de pago no especificado"));
        }
        
        try {
            pago.setMetodoPago(Pago.MetodoPago.valueOf(metodoPagoStr));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Método de pago inválido: " + metodoPagoStr));
        }
        
        pago.setEstado(Pago.Estado.pagado);
        pago.setFechaPago(LocalDate.now());
        
        // ✅ GUARDAR PAGO (puede ser save normal, ya tenemos reserva en BD)
        pago = pagoRepository.save(pago);
        logger.info("💳 Pago procesado con ID: {}", pago.getId());
        
        // ===== 6. GENERAR NÚMERO DE CONFIRMACIÓN =====
        String confirmationNumber = "TG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        logger.info("✅ Número de confirmación: {}", confirmationNumber);
        
        // ===== 7. GENERAR PDF =====
        byte[] pdfBytes = null;
        try {
            pdfBytes = pdfService.generateReservationPDF(reserva, viaje, usuario, pago);
            logger.info("📄 PDF generado: {} bytes", pdfBytes.length);
        } catch (Exception e) {
            logger.error("⚠️ Error al generar PDF (continuando sin PDF): {}", e.getMessage());
        }
        
        // ===== 8. ENVIAR EMAIL =====
        try {
            String userEmail = usuario.getCredencial().getCorreo();
            emailService.sendReservationConfirmation(
                userEmail,
                usuario.getPrimerNombre(),
                confirmationNumber,
                viaje,
                pago,
                pdfBytes
            );
            logger.info("📧 Email enviado a: {}", userEmail);
        } catch (Exception e) {
            logger.error("⚠️ Error al enviar email (continuando sin email): {}", e.getMessage());
        }
        
        // ===== 9. RESPUESTA EXITOSA =====
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Reserva confirmada exitosamente");
        response.put("confirmationNumber", confirmationNumber);
        response.put("reservaId", reserva.getId());
        response.put("viajeId", viaje.getId());
        response.put("pagoId", pago.getId());
        
        logger.info("🎉 Reserva completada exitosamente - Reserva ID: {}", reserva.getId());
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        logger.error("❌ Error al procesar reserva completa: {}", e.getMessage(), e);
        
        // Respuesta de error más detallada
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "ERROR");
        errorResponse.put("error", "Error al procesar la reserva");
        errorResponse.put("message", e.getMessage());
        errorResponse.put("type", e.getClass().getSimpleName());
        
        return ResponseEntity.internalServerError().body(errorResponse);
    }
}
}