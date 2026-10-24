-- Residue from the retired SaaS build: 11 tables that nothing in src/ reads or writes.
-- They exist in production with zero rows, but the default Supabase grants plus
-- permissive policies left them reachable through the Data API. Revoke access from the
-- public API roles and drop the policies; the table owner and service_role keep access.
--
-- Reversible on purpose (revoke instead of drop): re-grant and recreate a policy if a
-- feature ever needs one of these tables.

REVOKE ALL ON TABLE
  public.volunteer_reviews,
  public.user_badges,
  public.skill_competency_results,
  public.skill_competency_attempts,
  public.id_verification_submissions,
  public.org_api_keys,
  public.org_webhooks,
  public.transfer_requests,
  public.community_groups,
  public.group_members,
  public.shared_posts
FROM anon, authenticated, PUBLIC;

DROP POLICY IF EXISTS "Reviews are public" ON public.volunteer_reviews;
DROP POLICY IF EXISTS "Managers write reviews" ON public.volunteer_reviews;
DROP POLICY IF EXISTS "Reviewers edit own reviews" ON public.volunteer_reviews;

DROP POLICY IF EXISTS "Badges are public" ON public.user_badges;
DROP POLICY IF EXISTS "Users earn own badges" ON public.user_badges;

DROP POLICY IF EXISTS "Public read passed competency results" ON public.skill_competency_results;
DROP POLICY IF EXISTS "Users insert own competency results" ON public.skill_competency_results;
DROP POLICY IF EXISTS "Users read own competency results" ON public.skill_competency_results;
DROP POLICY IF EXISTS "Users update own competency results" ON public.skill_competency_results;

DROP POLICY IF EXISTS "Users insert own competency attempts" ON public.skill_competency_attempts;
DROP POLICY IF EXISTS "Users read own competency attempts" ON public.skill_competency_attempts;

DROP POLICY IF EXISTS "Admins review ID submissions" ON public.id_verification_submissions;
DROP POLICY IF EXISTS "Users view own ID submissions" ON public.id_verification_submissions;

DROP POLICY IF EXISTS "Managers manage API keys" ON public.org_api_keys;
DROP POLICY IF EXISTS "Managers manage webhooks" ON public.org_webhooks;

DROP POLICY IF EXISTS "Parties view transfers" ON public.transfer_requests;

DROP POLICY IF EXISTS "Public groups are visible" ON public.community_groups;
DROP POLICY IF EXISTS "Members view memberships" ON public.group_members;
DROP POLICY IF EXISTS "Authors view own posts" ON public.shared_posts;
