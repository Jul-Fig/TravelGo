package com.travelgo.backend_travelgo.repository;

import com.travelgo.backend_travelgo.model.Reserva;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Integer> {

    // ── Por usuario ──────────────────────────────────────────────────────────
    // CORREGIDO: eliminado el duplicado que recibía Long (innecesario y confuso)
    List<Reserva> findByUsuarioId(Integer usuarioId);

    // ── Por viaje ────────────────────────────────────────────────────────────
    List<Reserva> findByViajeId(Integer viajeId);

    // ── Por estado ───────────────────────────────────────────────────────────
    List<Reserva> findByEstado(Reserva.Estado estado);

    // ── Combinados ───────────────────────────────────────────────────────────
    List<Reserva> findByUsuarioIdAndEstado(Integer usuarioId, Reserva.Estado estado);
    List<Reserva> findByViajeIdAndEstado(Integer viajeId, Reserva.Estado estado);

    // ── Conteos ──────────────────────────────────────────────────────────────
    Long countByUsuarioId(Integer usuarioId);
    Long countByEstado(Reserva.Estado estado);
}