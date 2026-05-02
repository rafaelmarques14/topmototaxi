
-- Limpar dados existentes
DELETE FROM public.fila;
DELETE FROM public.viagens;
DELETE FROM public.motoqueiros;

-- Adicionar owner_id
ALTER TABLE public.motoqueiros ADD COLUMN owner_id uuid NOT NULL;
ALTER TABLE public.fila ADD COLUMN owner_id uuid NOT NULL;
ALTER TABLE public.viagens ADD COLUMN owner_id uuid NOT NULL;

CREATE INDEX idx_motoqueiros_owner ON public.motoqueiros(owner_id);
CREATE INDEX idx_fila_owner ON public.fila(owner_id);
CREATE INDEX idx_viagens_owner ON public.viagens(owner_id);

-- Recriar policies de motoqueiros
DROP POLICY IF EXISTS "admin delete motoqueiros" ON public.motoqueiros;
DROP POLICY IF EXISTS "admin insert motoqueiros" ON public.motoqueiros;
DROP POLICY IF EXISTS "admin update motoqueiros" ON public.motoqueiros;
DROP POLICY IF EXISTS "public read motoqueiros" ON public.motoqueiros;

CREATE POLICY "owner read motoqueiros" ON public.motoqueiros
  FOR SELECT USING (auth.uid() = owner_id OR true);
-- Mantemos leitura pública para a tela de atendimento, mas filtramos por owner via join na fila

DROP POLICY IF EXISTS "owner read motoqueiros" ON public.motoqueiros;
CREATE POLICY "public read motoqueiros" ON public.motoqueiros FOR SELECT USING (true);

CREATE POLICY "owner insert motoqueiros" ON public.motoqueiros
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

CREATE POLICY "owner update motoqueiros" ON public.motoqueiros
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

CREATE POLICY "owner delete motoqueiros" ON public.motoqueiros
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

-- Recriar policies de fila
DROP POLICY IF EXISTS "admin delete fila" ON public.fila;
DROP POLICY IF EXISTS "admin insert fila" ON public.fila;
DROP POLICY IF EXISTS "admin update fila" ON public.fila;
DROP POLICY IF EXISTS "public read fila" ON public.fila;

CREATE POLICY "public read fila" ON public.fila FOR SELECT USING (true);

CREATE POLICY "owner insert fila" ON public.fila
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

CREATE POLICY "owner update fila" ON public.fila
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

CREATE POLICY "owner delete fila" ON public.fila
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

-- Recriar policies de viagens
DROP POLICY IF EXISTS "admin delete viagens" ON public.viagens;
DROP POLICY IF EXISTS "admin insert viagens" ON public.viagens;
DROP POLICY IF EXISTS "admin read viagens" ON public.viagens;

CREATE POLICY "owner read viagens" ON public.viagens
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "owner insert viagens" ON public.viagens
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

CREATE POLICY "owner delete viagens" ON public.viagens
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = owner_id);

-- Atualizar trigger handle_new_user para SEMPRE dar role admin (cada conta é seu próprio admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
