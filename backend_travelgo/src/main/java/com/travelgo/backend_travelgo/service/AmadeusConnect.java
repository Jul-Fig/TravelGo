package com.travelgo.backend_travelgo.service;

import com.amadeus.Amadeus;
import com.amadeus.Params;
import com.amadeus.resources.Location;
import com.amadeus.resources.FlightOfferSearch;
import com.amadeus.resources.Hotel;
import com.amadeus.resources.TransferOffering;
import com.amadeus.exceptions.ResponseException;
import com.amadeus.referencedata.Locations;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AmadeusConnect {
    
    private static final Logger logger = LoggerFactory.getLogger(AmadeusConnect.class);
    private final Amadeus amadeus;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String clientId;
    private final String clientSecret;
    private String accessToken;
    private long tokenExpiration = 0;
    
    private static final String AMADEUS_AUTH_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";
    private static final String AMADEUS_TRANSFER_URL = "https://test.api.amadeus.com/v1/shopping/transfer-offers";
    
    public AmadeusConnect(
            @Value("${amadeus.client.id}") String clientId,
            @Value("${amadeus.client.secret}") String clientSecret) {
        
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        
        logger.info("INICIALIZANDO AMADEUS ");
        logger.info("Client ID: {}", clientId != null ? clientId.substring(0, Math.min(8, clientId.length())) + "..." : "null");
        
        try {
            this.amadeus = Amadeus.builder(clientId.trim(), clientSecret.trim())
                .setHostname("test")
                .build();
                
            logger.info("✅ Amadeus SDK inicializado correctamente en modo TEST");
            getAccessToken();
            logger.info("✅ Token de acceso obtenido para Transfer API");
            
        } catch (Exception e) {
            logger.error("❌ Error al inicializar Amadeus: {}", e.getMessage(), e);
            throw new RuntimeException("Error al inicializar Amadeus", e);
        }
    }
    
    private String getAccessToken() {
        try {
            if (accessToken != null && System.currentTimeMillis() < tokenExpiration) {
                return accessToken;
            }
            
            logger.info("🔐 Obteniendo nuevo token de acceso...");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            String body = "grant_type=client_credentials&client_id=" + clientId + 
                         "&client_secret=" + clientSecret;
            
            HttpEntity<String> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                AMADEUS_AUTH_URL, request, JsonNode.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode json = response.getBody();
                accessToken = json.get("access_token").asText();
                int expiresIn = json.get("expires_in").asInt();
                tokenExpiration = System.currentTimeMillis() + ((expiresIn - 300) * 1000L);
                logger.info("✅ Token obtenido exitosamente");
                return accessToken;
            }
            
            throw new RuntimeException("Error al obtener token de acceso");
            
        } catch (Exception e) {
            logger.error("❌ Error al obtener token: {}", e.getMessage());
            throw new RuntimeException("Error de autenticación con Amadeus", e);
        }
    }
    
    public boolean testAuthentication() {
        try {
            logger.info("🔐 Probando autenticación...");
            Location[] locations = amadeus.referenceData.locations.get(
                Params.with("keyword", "LON").and("subType", Locations.AIRPORT)
            );
            logger.info("✅ Autenticación exitosa - {} ubicaciones encontradas", locations.length);
            return true;
        } catch (Exception e) {
            logger.error("❌ Fallo en autenticación: {}", e.getMessage());
            return false;
        }
    }
    
    // VUELOS
    public Location[] location(String keyword) throws ResponseException {
        logger.info("🔍 Buscando ubicaciones para: {}", keyword);
        try {
            Location[] locations = amadeus.referenceData.locations.get(
                Params.with("keyword", keyword).and("subType", Locations.AIRPORT)
            );
            logger.info("✅ Encontradas {} ubicaciones", locations.length);
            return locations;
        } catch (ResponseException e) {
            logger.error("❌ Error en búsqueda de ubicaciones: {}", e.getMessage());
            throw e;
        }
    }
    
    public FlightOfferSearch[] searchFlights(String originLocationCode, 
                                           String destinationLocationCode, 
                                           String departureDate, 
                                           int adults, 
                                           int max) throws ResponseException {
        
        logger.info("✈️ Búsqueda de vuelo SOLO IDA: {} -> {}, Salida: {}, Adultos: {}, Max: {}", 
                   originLocationCode, destinationLocationCode, departureDate, adults, max);
        
        try {
            Params params = Params.with("originLocationCode", originLocationCode.trim())
                .and("destinationLocationCode", destinationLocationCode.trim())
                .and("departureDate", departureDate.trim())
                .and("adults", adults)
                .and("max", max)
                .and("currencyCode", "USD");
            
            logger.info("📡 Llamando a Amadeus API (solo ida)...");
            FlightOfferSearch[] flightOffers = amadeus.shopping.flightOffersSearch.get(params);
            logger.info("✅ Encontrados {} vuelos de ida", flightOffers.length);
            return flightOffers;
            
        } catch (ResponseException e) {
            logger.error("❌ Error Amadeus API: Status={}, Message={}", 
                e.getResponse() != null ? e.getResponse().getStatusCode() : "N/A", e.getMessage());
            throw e;
        }
    }
    
    public FlightOfferSearch[] searchRoundTripFlights(String originLocationCode, 
                                                     String destinationLocationCode, 
                                                     String departureDate,
                                                     String returnDate,
                                                     int adults, 
                                                     int max) throws ResponseException {
        
        logger.info("🔄 Búsqueda de vuelo IDA Y VUELTA: {} -> {}, Salida: {}, Regreso: {}", 
                   originLocationCode, destinationLocationCode, departureDate, returnDate);
        
        try {
            if (returnDate == null || returnDate.trim().isEmpty()) {
                throw new IllegalArgumentException("La fecha de regreso es requerida");
            }
            
            Params params = Params.with("originLocationCode", originLocationCode.trim())
                .and("destinationLocationCode", destinationLocationCode.trim())
                .and("departureDate", departureDate.trim())
                .and("returnDate", returnDate.trim())
                .and("adults", adults)
                .and("max", max)
                .and("currencyCode", "USD");
            
            FlightOfferSearch[] flightOffers = amadeus.shopping.flightOffersSearch.get(params);
            logger.info("✅ Encontrados {} vuelos", flightOffers.length);
            return flightOffers;
            
        } catch (ResponseException e) {
            logger.error("❌ Error Amadeus API: {}", e.getMessage());
            throw e;
        }
    }
    
    // HOTELES
    public Hotel[] searchHotelsByCity(String cityCode) throws ResponseException {
        logger.info("🏨 Búsqueda de hoteles en ciudad: {}", cityCode);
        try {
            Hotel[] hotels = amadeus.referenceData.locations.hotels.byCity.get(
                Params.with("cityCode", cityCode.trim())
            );
            logger.info("✅ Encontrados {} hoteles", hotels.length);
            return hotels;
        } catch (ResponseException e) {
            logger.error("❌ Error Amadeus API: {}", e.getMessage());
            throw e;
        }
    }
    
    public Hotel[] searchHotelsByGeoCode(double latitude, double longitude, Integer radius) throws ResponseException {
        logger.info("🏨 Búsqueda de hoteles por geocode: Lat: {}, Lon: {}", latitude, longitude);
        try {
            Params params = Params.with("latitude", latitude).and("longitude", longitude);
            if (radius != null && radius > 0) {
                params.and("radius", radius).and("radiusUnit", "KM");
            }
            Hotel[] hotels = amadeus.referenceData.locations.hotels.byGeocode.get(params);
            logger.info("✅ Encontrados {} hoteles", hotels.length);
            return hotels;
        } catch (ResponseException e) {
            logger.error("❌ Error Amadeus API: {}", e.getMessage());
            throw e;
        }
    }
    
    public Hotel[] searchHotelsByHotelIds(String[] hotelIds) throws ResponseException {
        logger.info("🏨 Buscando {} hoteles por IDs", hotelIds.length);
        try {
            String hotelIdsStr = String.join(",", hotelIds);
            Hotel[] hotels = amadeus.referenceData.locations.hotels.byHotels.get(
                Params.with("hotelIds", hotelIdsStr)
            );
            logger.info("✅ Encontrados {} hoteles", hotels.length);
            return hotels;
        } catch (ResponseException e) {
            logger.error("❌ Error Amadeus API: {}", e.getMessage());
            throw e;
        }
    }
    
    /**
     * ✅ MÉTODO CORREGIDO - Transfer Search API v1 con POST
     * SIN Gson - usa solo ObjectMapper de Jackson
     */
    public TransferOffering[] searchAirportTransfers(
        String airportCode,
        String cityName,
        String countryCode,
        String dateTime,
        int passengers) throws ResponseException {
    
    logger.info("🚗 Búsqueda de transfers: {} -> {} ({}), Fecha: {}, Pasajeros: {}", 
               airportCode, cityName, countryCode, dateTime, passengers);
    
    try {
        String token = getAccessToken();
        
        // Obtener coordenadas
        double[] coords = getCityCoordinates(cityName, countryCode);
        logger.info("📍 Usando coordenadas: [{}, {}]", coords[0], coords[1]);
        
        // Body JSON con coordenadas
        Map<String, Object> requestBody = new HashMap<>();
        
        requestBody.put("startLocationCode", airportCode.trim());
        
        // Geocodes (OBLIGATORIO)
        Map<String, Double> endGeoCode = new HashMap<>();
        endGeoCode.put("latitude", coords[0]);
        endGeoCode.put("longitude", coords[1]);
        requestBody.put("endGeoCode", endGeoCode);
        
        // Dirección (complementario)
        requestBody.put("endAddressLine", cityName.trim());
        requestBody.put("endCountryCode", countryCode.trim().toUpperCase());
        
        // Otros parámetros
        requestBody.put("transferType", "PRIVATE");
        requestBody.put("startDateTime", dateTime.trim());
        requestBody.put("passengers", passengers);
        
        logger.info("📦 Request Body: {}", objectMapper.writeValueAsString(requestBody));
        
        // Headers
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/vnd.amadeus+json");
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        logger.info("📡 POST Request to: {}", AMADEUS_TRANSFER_URL);
        
        ResponseEntity<JsonNode> response = restTemplate.exchange(
            AMADEUS_TRANSFER_URL, 
            HttpMethod.POST,
            entity, 
            JsonNode.class
        );
        
        logger.info("📥 Status Code: {}", response.getStatusCode());
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            JsonNode result = response.getBody();
            
            logger.info("📦 Response Body: {}", result.toPrettyString());
            
            if (result.has("data")) {
                JsonNode data = result.get("data");
                List<TransferOffering> offerings = new ArrayList<>();
                
                if (data.isArray()) {
                    for (JsonNode item : data) {
                        try {
                            // ✅ USAR OBJECTMAPPER en lugar de Gson
                            TransferOffering offering = objectMapper.treeToValue(item, TransferOffering.class);
                            offerings.add(offering);
                        } catch (Exception e) {
                            logger.warn("⚠️ Error parseando transfer: {}", e.getMessage());
                        }
                    }
                }
                
                logger.info("✅ Encontrados {} transfers", offerings.size());
                return offerings.toArray(new TransferOffering[0]);
            }
            
            if (result.has("warnings")) {
                logger.warn("⚠️ Warnings: {}", result.get("warnings").toString());
            }
        }
        
        logger.warn("⚠️ No se encontraron transfers - Status: {}", response.getStatusCode());
        return new TransferOffering[0];
        
    } catch (org.springframework.web.client.HttpClientErrorException e) {
        logger.error("❌ Error HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
        
        try {
            JsonNode errorResponse = objectMapper.readTree(e.getResponseBodyAsString());
            if (errorResponse.has("errors")) {
                JsonNode errors = errorResponse.get("errors");
                for (JsonNode error : errors) {
                    int code = error.has("code") ? error.get("code").asInt() : 0;
                    String title = error.has("title") ? error.get("title").asText() : "N/A";
                    String detail = error.has("detail") ? error.get("detail").asText() : "N/A";
                    logger.error("❌ Amadeus Error {}: {} - {}", code, title, detail);
                }
            }
        } catch (Exception parseError) {
            logger.error("Error parsing error response", parseError);
        }
        
        throw new RuntimeException("Error en Amadeus Transfer API: " + e.getMessage(), e);
        
    } catch (Exception e) {
        logger.error("❌ Error inesperado: {}", e.getMessage(), e);
        throw new RuntimeException("Error al buscar transfers: " + e.getMessage(), e);
    }
}

/**
 * Obtener coordenadas GPS de ciudades conocidas
 */
private double[] getCityCoordinates(String cityName, String countryCode) {
    Map<String, double[]> cityCoords = new HashMap<>();
    
    // Europa
    cityCoords.put("Athens_GR", new double[]{37.9838, 23.7275});
    cityCoords.put("Madrid_ES", new double[]{40.4168, -3.7038});
    cityCoords.put("Barcelona_ES", new double[]{41.3851, 2.1734});
    cityCoords.put("Paris_FR", new double[]{48.8566, 2.3522});
    cityCoords.put("London_GB", new double[]{51.5074, -0.1278});
    cityCoords.put("Rome_IT", new double[]{41.9028, 12.4964});
    cityCoords.put("Berlin_DE", new double[]{52.5200, 13.4050});
    cityCoords.put("Amsterdam_NL", new double[]{52.3676, 4.9041});
    cityCoords.put("Lisbon_PT", new double[]{38.7223, -9.1393});
    cityCoords.put("Vienna_AT", new double[]{48.2082, 16.3738});
    
    // América
    cityCoords.put("New York_US", new double[]{40.7128, -74.0060});
    cityCoords.put("Los Angeles_US", new double[]{34.0522, -118.2437});
    cityCoords.put("Miami_US", new double[]{25.7617, -80.1918});
    cityCoords.put("Chicago_US", new double[]{41.8781, -87.6298});
    cityCoords.put("San Francisco_US", new double[]{37.7749, -122.4194});
    
    // Latinoamérica
    cityCoords.put("Bogota_CO", new double[]{4.7110, -74.0721});
    cityCoords.put("Mexico City_MX", new double[]{19.4326, -99.1332});
    cityCoords.put("Buenos Aires_AR", new double[]{-34.6037, -58.3816});
    cityCoords.put("Lima_PE", new double[]{-12.0464, -77.0428});
    cityCoords.put("Santiago_CL", new double[]{-33.4489, -70.6693});
    
    String key = cityName + "_" + countryCode;
    double[] coords = cityCoords.get(key);
    
    if (coords != null) {
        logger.info("📍 Coordenadas encontradas para {}: [{}, {}]", cityName, coords[0], coords[1]);
        return coords;
    }
    
    logger.warn("⚠️ Coordenadas no encontradas para {} ({}), usando París por defecto", cityName, countryCode);
    return new double[]{48.8566, 2.3522}; // París como fallback
}
    
}