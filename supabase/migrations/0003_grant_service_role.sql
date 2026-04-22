-- 0002 only granted to `authenticated`; service_role was left out, which
-- breaks server-side admin queries (and any code using the service key).
--
-- This migration additionally grants all app-table privileges to service_role.

GRANT SELECT, UPDATE ON TABLE public.users                    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.captures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events   TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reminders TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
