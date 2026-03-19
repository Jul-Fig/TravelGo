package com.travelgo.backend_travelgo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Modelo Transporte - Compatible con tabla existente en BD y Amadeus Transfers
 * Soporta múltiples tipos de transporte, especialmente transfers de aeropuerto
 */
@Entity
@Table(name = "transporte")
public class Transporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", columnDefinition = "ENUM('Avion', 'Bus', 'Tren', 'Barco', 'Auto_Rental', 'Taxi', 'Transfer')", nullable = false)
    private Tipo tipo;

    @Column(name = "proveedor", length = 100)
    private String proveedor;
    
    @Column(name = "numero_transporte", length = 50)
    private String numeroTransporte;

    @Column(name = "salida")
    private LocalDateTime salida;

    @Column(name = "llegada")
    private LocalDateTime llegada;

    @Column(name = "origen", length = 100)
    private String origen;

    @Column(name = "destino", length = 100)
    private String destino;

    
    @Column(name = "amadeus_id", length = 50)
    private String amadeusId;

    @Column(name = "booking_reference", length = 50)
    private String bookingReference;

    @Column(name = "precio", precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "currency", length = 3)
    private String currency = "USD";

    @Column(name = "capacidad")
    private Integer capacidad;

    @Column(name = "categoria", length = 50)
    private String categoria;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", columnDefinition = "ENUM('disponible', 'reservado', 'cancelado')")
    private Estado estado = Estado.disponible;

    @Column(name = "detalles_json", columnDefinition = "LONGTEXT")
    private String detallesJson;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

  
    // NUEVOS CAMPOS PARA TRANSFERS DE AMADEUS
    
    
    @Column(name = "transfer_id", length = 50)
    private String transferId;
    
    @Column(name = "vehiculo_tipo", length = 50)
    private String vehiculoTipo;
    
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;
    
    @Column(name = "distancia", precision = 10, scale = 2)
    private BigDecimal distancia;
    
    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;
    
    @Column(name = "transfer_details", columnDefinition = "LONGTEXT")
    private String transferDetails;

    
    // Relación opcional con viaje
    
    
    @ManyToOne
    @JoinColumn(name = "viaje_id", nullable = true)
    private Viaje viaje;

    
    // Lifecycle Callbacks
    
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (estado == null) {
            estado = Estado.disponible;
        }
        if (currency == null) {
            currency = "USD";
        }
    }

    // ========================================
    // Constructores
    // ========================================
    
    public Transporte() {}

    public Transporte(Tipo tipo, String origen, String destino, BigDecimal precio) {
        this.tipo = tipo;
        this.origen = origen;
        this.destino = destino;
        this.precio = precio;
        this.estado = Estado.disponible;
    }
    
    public Transporte(Tipo tipo, String origen, String destino, BigDecimal precio, String currency) {
        this.tipo = tipo;
        this.origen = origen;
        this.destino = destino;
        this.precio = precio;
        this.currency = currency;
        this.estado = Estado.disponible;
    }

    // ========================================
    // GETTERS Y SETTERS
    // ========================================
    
    public Integer getId() { 
        return id; 
    }
    
    public void setId(Integer id) { 
        this.id = id; 
    }

    public Tipo getTipo() { 
        return tipo; 
    }
    
    public void setTipo(Tipo tipo) { 
        this.tipo = tipo; 
    }

    public String getProveedor() { 
        return proveedor; 
    }
    
    public void setProveedor(String proveedor) { 
        this.proveedor = proveedor; 
    }
    
    public String getNumeroTransporte() { 
        return numeroTransporte; 
    }
    
    public void setNumeroTransporte(String numeroTransporte) { 
        this.numeroTransporte = numeroTransporte; 
    }

    public LocalDateTime getSalida() { 
        return salida; 
    }
    
    public void setSalida(LocalDateTime salida) { 
        this.salida = salida; 
    }

    public LocalDateTime getLlegada() { 
        return llegada; 
    }
    
    public void setLlegada(LocalDateTime llegada) { 
        this.llegada = llegada; 
    }

    public String getOrigen() { 
        return origen; 
    }
    
    public void setOrigen(String origen) { 
        this.origen = origen; 
    }

    public String getDestino() { 
        return destino; 
    }
    
    public void setDestino(String destino) { 
        this.destino = destino; 
    }

    public String getAmadeusId() { 
        return amadeusId; 
    }
    
    public void setAmadeusId(String amadeusId) { 
        this.amadeusId = amadeusId; 
    }

    public String getBookingReference() { 
        return bookingReference; 
    }
    
    public void setBookingReference(String bookingReference) { 
        this.bookingReference = bookingReference; 
    }

    public BigDecimal getPrecio() { 
        return precio; 
    }
    
    public void setPrecio(BigDecimal precio) { 
        this.precio = precio; 
    }

    public String getCurrency() { 
        return currency; 
    }
    
    public void setCurrency(String currency) { 
        this.currency = currency; 
    }

    public Integer getCapacidad() { 
        return capacidad; 
    }
    
    public void setCapacidad(Integer capacidad) { 
        this.capacidad = capacidad; 
    }

    public String getCategoria() { 
        return categoria; 
    }
    
    public void setCategoria(String categoria) { 
        this.categoria = categoria; 
    }

    public Estado getEstado() { 
        return estado; 
    }
    
    public void setEstado(Estado estado) { 
        this.estado = estado; 
    }

    public String getDetallesJson() { 
        return detallesJson; 
    }
    
    public void setDetallesJson(String detallesJson) { 
        this.detallesJson = detallesJson; 
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }
    
    // ========================================
    // Getters/Setters para campos de Transfers
    // ========================================
    
    public String getTransferId() { 
        return transferId; 
    }
    
    public void setTransferId(String transferId) { 
        this.transferId = transferId; 
    }
    
    public String getVehiculoTipo() { 
        return vehiculoTipo; 
    }
    
    public void setVehiculoTipo(String vehiculoTipo) { 
        this.vehiculoTipo = vehiculoTipo; 
    }
    
    public String getDescripcion() { 
        return descripcion; 
    }
    
    public void setDescripcion(String descripcion) { 
        this.descripcion = descripcion; 
    }
    
    public BigDecimal getDistancia() { 
        return distancia; 
    }
    
    public void setDistancia(BigDecimal distancia) { 
        this.distancia = distancia; 
    }
    
    public Integer getDuracionMinutos() { 
        return duracionMinutos; 
    }
    
    public void setDuracionMinutos(Integer duracionMinutos) { 
        this.duracionMinutos = duracionMinutos; 
    }
    
    public String getTransferDetails() { 
        return transferDetails; 
    }
    
    public void setTransferDetails(String transferDetails) { 
        this.transferDetails = transferDetails; 
    }

    public Viaje getViaje() { 
        return viaje; 
    }
    
    public void setViaje(Viaje viaje) { 
        this.viaje = viaje; 
    }

    // ========================================
    // Métodos deprecados para compatibilidad
    // ========================================
    
    @Deprecated
    public String getNumero_transporte() { 
        return numeroTransporte; 
    }
    
    @Deprecated
    public void setNumero_transporte(String numeroTransporte) { 
        this.numeroTransporte = numeroTransporte; 
    }

    // ========================================
    // Enums
    // ========================================
    
    public enum Tipo {
        Avion, Bus, Tren, Barco, Auto_Rental, Taxi, Transfer
    }

    public enum Estado {
        disponible, reservado, cancelado
    }

    // ========================================
    // Métodos auxiliares
    // ========================================
    
    /**
     * Obtiene descripción formateada del transporte
     */
    public String getDescripcionCompleta() {
        StringBuilder sb = new StringBuilder();
        
        sb.append(tipo).append(" - ");
        
        if (vehiculoTipo != null) {
            sb.append(vehiculoTipo).append(" - ");
        }
        
        sb.append(origen).append(" → ").append(destino);
        
        if (capacidad != null) {
            sb.append(" (").append(capacidad).append(" personas)");
        }
        
        return sb.toString();
    }
    
    /**
     * Obtiene precio formateado con moneda
     */
    public String getPrecioFormateado() {
        if (precio == null) {
            return "N/A";
        }
        return currency + " " + precio;
    }
    
    /**
     * Verifica si el transporte está disponible
     */
    public boolean estaDisponible() {
        return estado == Estado.disponible;
    }
    
    /**
     * Verifica si es un transfer de aeropuerto
     */
    public boolean esTransferAeropuerto() {
        return tipo == Tipo.Transfer && transferId != null;
    }

    // ========================================
    // toString, equals, hashCode
    // ========================================
    
    @Override
    public String toString() {
        return "Transporte{" +
                "id=" + id +
                ", tipo=" + tipo +
                ", origen='" + origen + '\'' +
                ", destino='" + destino + '\'' +
                ", vehiculoTipo='" + vehiculoTipo + '\'' +
                ", precio=" + precio +
                ", currency='" + currency + '\'' +
                ", capacidad=" + capacidad +
                ", estado=" + estado +
                ", transferId='" + transferId + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        
        Transporte that = (Transporte) o;
        
        if (id != null && that.id != null) {
            return id.equals(that.id);
        }
        
        if (transferId != null && that.transferId != null) {
            return transferId.equals(that.transferId);
        }
        
        return false;
    }

    @Override
    public int hashCode() {
        if (id != null) {
            return id.hashCode();
        }
        if (transferId != null) {
            return transferId.hashCode();
        }
        return super.hashCode();
    }
}