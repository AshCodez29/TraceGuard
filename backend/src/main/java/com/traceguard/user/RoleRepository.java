package com.traceguard.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<RoleEntity, Byte> {
    Optional<RoleEntity> findByName(String name);
}
