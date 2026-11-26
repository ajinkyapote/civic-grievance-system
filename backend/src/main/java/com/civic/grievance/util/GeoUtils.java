package com.civic.grievance.util;

public class GeoUtils {

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    /**
     * Calculates exact spherical distance in meters between two GPS coordinates
     * using the Haversine formula.
     */
    public static double calculateHaversineDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(rLat1) * Math.cos(rLat2)
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}