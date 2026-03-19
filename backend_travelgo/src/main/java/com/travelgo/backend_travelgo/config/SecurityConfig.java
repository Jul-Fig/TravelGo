package com.travelgo.backend_travelgo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuración de seguridad — CORS lee la variable de entorno FRONTEND_URL
 * para funcionar tanto en local como en producción sin cambiar código.
 *
 * Local:      FRONTEND_URL no definida → usa los orígenes de desarrollo
 * Producción: FRONTEND_URL=https://travelgo.vercel.app
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Origen del frontend leído desde variable de entorno.
     * En local no hace falta definirla (usa el fallback).
     * En Railway: Settings → Variables → FRONTEND_URL = https://tu-app.vercel.app
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:4173}")
    private String allowedOriginsRaw;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // ─── CORS ─────────────────────────────────────────────────────────────────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Soporta múltiples orígenes separados por coma en la variable de entorno
        // Ejemplo: "https://travelgo.vercel.app,https://travelgo-staging.vercel.app"
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ─── Security filter chain ─────────────────────────────────────────────────
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── Públicos: autenticación ──────────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/usuarios/{id}").permitAll()

                // ── Públicos: búsqueda ───────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/flights/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/hotels/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/transporte/search-transfers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/transporte/disponibles").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/transporte/por-tipo").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/transporte/buscar").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/transporte/example").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/transporte/test").permitAll()

                // ── Protegidos ───────────────────────────────────────────────
                .requestMatchers("/api/viajes/**").authenticated()
                .requestMatchers("/api/reservas/**").authenticated()
                .requestMatchers("/api/pago/**").authenticated()
                .requestMatchers("/api/bookings/**").authenticated()

                .requestMatchers(HttpMethod.POST,   "/api/transporte").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/transporte/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/transporte/**").authenticated()

                // ── Solo admin ───────────────────────────────────────────────
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/administrador/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/usuarios").hasAuthority("ROLE_ADMIN")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}