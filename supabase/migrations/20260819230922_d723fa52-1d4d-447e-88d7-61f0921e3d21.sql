INSERT INTO public.user_roles (user_id, role)
VALUES ('b1737fb4-399f-4604-81b8-052e23a1c92e', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- motoqueiros
CREATE POLICY "super admin all motoqueiros" ON public.motoqueiros
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- fila
CREATE POLICY "super admin all fila" ON public.fila
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- viagens
CREATE POLICY "super admin all viagens" ON public.viagens
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- user_roles: super admin pode ler todos os papéis
CREATE POLICY "super admin read roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));