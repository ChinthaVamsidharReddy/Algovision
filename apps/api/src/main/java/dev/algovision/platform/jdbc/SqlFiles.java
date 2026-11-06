package dev.algovision.platform.jdbc;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;

/** Loads a statement from {@code resources/sql/<dir>/<name>.sql}. The same files are run against real PostgreSQL by infra/db/verify-*.sh. */
public final class SqlFiles {

    private SqlFiles() {}

    public static String load(String dir, String name) {
        try (var in = new ClassPathResource("sql/" + dir + "/" + name + ".sql").getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).strip();
        } catch (IOException e) {
            throw new UncheckedIOException("Missing SQL file " + dir + "/" + name, e);
        }
    }
}
