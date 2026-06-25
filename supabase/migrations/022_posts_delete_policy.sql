-- Migration 022: Posts Delete RLS Policies

-- 1. Drop existing policies to ensure clean state
drop policy if exists "Posts: own delete" on public.posts;
drop policy if exists "Posts: super admin delete" on public.posts;
drop policy if exists "Posts: college admin delete" on public.posts;
drop policy if exists "Posts: moderator delete" on public.posts;

-- 2. Create own delete policy (Post author can delete own post)
create policy "Posts: own delete"
  on public.posts for delete
  using (auth.uid() = author_id);

-- 3. Create super admin delete policy (SUPER_ADMIN can delete any post)
create policy "Posts: super admin delete"
  on public.posts for delete
  using (public.is_super_admin(auth.uid()));

-- 4. Create college admin delete policy (COLLEGE_ADMIN can delete posts within their college)
create policy "Posts: college admin delete"
  on public.posts for delete
  using (
    (select role from public.profiles where id = auth.uid()) = 'COLLEGE_ADMIN'
    and (select college_id from public.profiles where id = author_id) = (select college_id from public.profiles where id = auth.uid())
  );

-- 5. Restore community moderator delete policy
create policy "Posts: moderator delete"
  on public.posts for delete
  using (
    exists (
      select 1 from public.community_members
      where community_id = public.posts.community_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );
