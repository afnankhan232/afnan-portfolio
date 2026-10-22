(() => {
  const config = window.ADMIN_CONFIG || {};
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) return;

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  window.watchPortfolioSettings = (onChange) => {
    let active = true;
    let changeVersion = 0;

    const channel = client
      .channel('portfolio-settings-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'portfolio_settings',
        filter: 'id=eq.projects'
      }, (payload) => {
        if (!payload.new || payload.new.id !== 'projects') return;
        changeVersion += 1;
        onChange(payload.new);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') loadSettings();
      });

    async function loadSettings() {
      const versionAtStart = changeVersion;
      const { data, error } = await client
        .from('portfolio_settings')
        .select('*')
        .eq('id', 'projects')
        .maybeSingle();

      if (active && !error && data && versionAtStart === changeVersion) onChange(data);
    }

    loadSettings();
    const stop = () => {
      if (!active) return;
      active = false;
      client.removeChannel(channel);
      window.removeEventListener('beforeunload', stop);
    };
    window.addEventListener('beforeunload', stop, { once: true });
    return stop;
  };
})();
