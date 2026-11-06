package dev.algovision.identity.jdbc;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;

/** Loads a statement from {@code resources/sql/identity}. The same files are executed against real PostgreSQL by infra/db/verify-identity.sh. */
final class Sql {

    private Sql() {}

    static String load(String name) {
        try (var in = new ClassPathResource("sql/identity/" + name + ".sql").getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).strip();
        } catch (IOException e) {
            throw new UncheckedIOException("Missing SQL file " + name, e);
        }
    }
}
