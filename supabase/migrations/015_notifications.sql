-- ============================================================
-- MIGRATION 015: Notification Foundation
-- ============================================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  content     text,
  type        text NOT NULL CHECK (type IN ('message', 'friend_request', 'system', 'event')),
  link        text,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: own select"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Notifications: own update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Automation: Notify on New Message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type, link)
  VALUES (
    NEW.receiver_id,
    'New Message',
    substring(NEW.content from 1 for 50),
    'message',
    '/messages'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- 4. Automation: Notify on Friend Request
CREATE OR REPLACE FUNCTION public.notify_on_friendship()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, content, type, link)
    VALUES (
      NEW.addressee_id,
      'New Friend Request',
      'Someone wants to be your friend!',
      'friend_request',
      '/friends'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_friendship ON public.friendships;
CREATE TRIGGER trg_notify_on_friendship
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friendship();

-- 5. Realtime Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
