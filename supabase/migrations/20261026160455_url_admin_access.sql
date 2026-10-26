-- URL-only administration explicitly requested by the owner.
-- Any authenticated anonymous session can obtain an administrative grant.
create function hardware_private.open_admin()
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Não foi possível iniciar a sessão. Recarregue a página.';end if;
 insert into hardware_private.admin_sessions(user_id,expires_at) values(uid,now()+interval '8 hours') on conflict(user_id) do update set expires_at=excluded.expires_at;
 return jsonb_build_object('authorized',true);
end $$;
create function public.lab_open_admin()
returns jsonb language sql security invoker set search_path='' as $$select hardware_private.open_admin()$$;
revoke all on function hardware_private.open_admin(),public.lab_open_admin() from public,anon;
grant execute on function hardware_private.open_admin(),public.lab_open_admin() to authenticated;
