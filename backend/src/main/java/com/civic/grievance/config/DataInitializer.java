package com.civic.grievance.config;

import com.civic.grievance.entity.User;
import com.civic.grievance.entity.Ward;
import com.civic.grievance.repository.UserRepository;
import com.civic.grievance.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedWard("WARD-01", "Station Road & Central Terminal", "Zone-A (Central)", 19.0178, 73.0991);
        seedWard("WARD-02", "Sector 4 Commercial Market", "Zone-A (Central)", 19.0195, 73.1010);
        seedWard("WARD-03", "Bus Depot & Highway Junction", "Zone-B (South)", 19.0160, 73.0975);
        seedWard("WARD-04", "Vidya Niketan School & Residential", "Zone-C (North)", 19.0210, 73.0980);

        seedUser("Municipal Commissioner", "admin@civic.gov.in", "admin123", User.Role.SUPER_ADMIN, User.Department.ALL);
        seedUser("Roads Dept Officer", "roads.officer@civic.gov.in", "officer123", User.Role.DEPT_OFFICER, User.Department.ROADS);
        seedUser("Water Dept Officer", "water.officer@civic.gov.in", "officer123", User.Role.DEPT_OFFICER, User.Department.WATER);
        seedUser("Electricity Officer", "power.officer@civic.gov.in", "officer123", User.Role.DEPT_OFFICER, User.Department.ELECTRICITY);
        seedUser("Sanitation Officer", "sanitation.officer@civic.gov.in", "officer123", User.Role.DEPT_OFFICER, User.Department.SANITATION);
        seedUser("Ramesh (Roads Field Eng)", "ramesh.roads@civic.gov.in", "field123", User.Role.FIELD_ENGINEER, User.Department.ROADS);
        seedUser("Suresh (Water Field Eng)", "suresh.water@civic.gov.in", "field123", User.Role.FIELD_ENGINEER, User.Department.WATER);
        seedUser("Vikram (Power Field Eng)", "vikram.power@civic.gov.in", "field123", User.Role.FIELD_ENGINEER, User.Department.ELECTRICITY);
        seedUser("Anita (Sanitation Eng)", "anita.sanitation@civic.gov.in", "field123", User.Role.FIELD_ENGINEER, User.Department.SANITATION);
        seedUser("Rahul Sharma (Citizen)", "citizen@civic.gov.in", "citizen123", User.Role.CITIZEN, User.Department.NONE);
    }

    private void seedWard(String code, String name, String zone, double lat, double lng) {
        if (!wardRepository.existsByWardCode(code)) {
            wardRepository.save(Ward.builder()
                .wardCode(code)
                .wardName(name)
                .zoneName(zone)
                .centerLat(lat)
                .centerLng(lng)
                .build());
        }
    }

    private void seedUser(String name, String email, String rawPass, User.Role role, User.Department dept) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPass))
                .role(role)
                .department(dept)
                .active(true)
                .build());
        }
    }
}
