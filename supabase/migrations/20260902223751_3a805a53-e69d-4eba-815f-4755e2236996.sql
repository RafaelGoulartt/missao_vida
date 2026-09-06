CREATE TABLE public.collection_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  maps_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_points TO authenticated;
GRANT ALL ON public.collection_points TO service_role;
ALTER TABLE public.collection_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view collection points" ON public.collection_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert collection points" ON public.collection_points FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update collection points" ON public.collection_points FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete collection points" ON public.collection_points FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_collection_points_updated_at BEFORE UPDATE ON public.collection_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  can_enroll_classes boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own permissions" ON public.user_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert permissions" ON public.user_permissions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update permissions" ON public.user_permissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete permissions" ON public.user_permissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.can_enroll_classes(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND can_enroll_classes = true
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_enroll_classes(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_enroll_classes(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.class_enrollments;
CREATE POLICY "Users can insert their own enrollments" ON public.class_enrollments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.can_enroll_classes(auth.uid()));