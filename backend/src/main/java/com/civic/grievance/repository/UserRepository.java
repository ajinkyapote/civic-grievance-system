package com.civic.grievance.repository;

import com.civic.grievance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleAndDepartment(User.Role role, User.Department department);
    List<User> findByRole(User.Role role);
}
