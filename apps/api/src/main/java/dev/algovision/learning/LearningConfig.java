package dev.algovision.learning;

import dev.algovision.learning.core.LearningService;
import dev.algovision.learning.core.LearningStore;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LearningConfig {

    @Bean
    LearningService learningService(LearningStore store, Clock clock) {
        return new LearningService(store, clock);
    }
}
