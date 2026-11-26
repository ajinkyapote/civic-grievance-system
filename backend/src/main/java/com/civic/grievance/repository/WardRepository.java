package com.civic.grievance.repository;

import com.civic.grievance.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WardRepository extends JpaRepository<Ward, Long> {
    boolean existsByWardCode(String wardCode);
}
