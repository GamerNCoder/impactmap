-- Keep the shared demo accounts alive. A visitor can otherwise open /profile and delete the
-- account, which would break /demo for everyone until the seed runs again. The auth trigger
-- raises, and delete_my_account turns that into a normal {ok:false} response.

CREATE OR REPLACE FUNCTION public.protect_demo_accounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email LIKE 'demo.%@impactmap.app' THEN
    RAISE EXCEPTION 'demo account cannot be deleted';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_demo_accounts ON auth.users;
CREATE TRIGGER protect_demo_accounts
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_demo_accounts();
