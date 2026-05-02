
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Motoqueiros
CREATE TABLE public.motoqueiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  numero TEXT NOT NULL,
  data_nascimento DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.motoqueiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read motoqueiros" ON public.motoqueiros FOR SELECT USING (true);
CREATE POLICY "admin insert motoqueiros" ON public.motoqueiros FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update motoqueiros" ON public.motoqueiros FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete motoqueiros" ON public.motoqueiros FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fila
CREATE TABLE public.fila (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motoqueiro_id UUID NOT NULL REFERENCES public.motoqueiros(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fila ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read fila" ON public.fila FOR SELECT USING (true);
CREATE POLICY "admin insert fila" ON public.fila FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update fila" ON public.fila FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete fila" ON public.fila FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Viagens
CREATE TABLE public.viagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motoqueiro_id UUID NOT NULL REFERENCES public.motoqueiros(id) ON DELETE CASCADE,
  iniciada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin read viagens" ON public.viagens FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert viagens" ON public.viagens FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete viagens" ON public.viagens FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fila;
ALTER PUBLICATION supabase_realtime ADD TABLE public.motoqueiros;

-- Trigger: primeiro usuário cadastrado vira admin automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
