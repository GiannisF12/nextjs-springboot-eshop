package com.giannis.eshop.repository;

import com.giannis.eshop.model.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for the singleton store_settings row. Service layer
 * always fetches/updates id = 1 and never inserts a new row.
 */
public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
}
