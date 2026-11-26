package com.civic.grievance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GrievanceBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(GrievanceBackendApplication.class, args);
    }
}
