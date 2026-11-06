package dev.algovision.catalog;

import dev.algovision.catalog.core.CatalogService;
import dev.algovision.catalog.core.CatalogStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CatalogConfig {

    @Bean
    CatalogService catalogService(CatalogStore store) {
        return new CatalogService(store);
    }
}
