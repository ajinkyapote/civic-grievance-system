package com.civic.grievance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ward_code", unique = true, nullable = false, length = 20)
    private String wardCode;

    @Column(name = "ward_name", nullable = false, length = 100)
    private String wardName;

    @Column(name = "zone_name", nullable = false, length = 100)
    private String zoneName;

    @Column(name = "center_lat", nullable = false)
    private Double centerLat;

    @Column(name = "center_lng", nullable = false)
    private Double centerLng;
}
