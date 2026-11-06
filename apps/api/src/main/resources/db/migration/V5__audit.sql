-- Append-only record of admin writes. actor_id deliberately has no foreign key so history survives user deletion.
CREATE TABLE audit_logs (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    uuid,
    action      text        NOT NULL,
    entity_type text        NOT NULL,
    entity_id   text        NOT NULL,
    summary     jsonb       NOT NULL DEFAULT '{}',
    occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_time ON audit_logs (occurred_at);
CREATE INDEX ix_audit_logs_entity ON audit_logs (entity_type, entity_id);

CREATE FUNCTION audit_logs_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();
