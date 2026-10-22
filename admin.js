(() => {
  if (localStorage.getItem('ak-admin-gate') !== 'passed') {
    window.location.replace('admin-gate.html');
    return;
  }

  const config = window.ADMIN_CONFIG || {};
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const projectsForm = document.getElementById('projectsForm');
  const resumeForm = document.getElementById('resumeForm');
  const authStatus = document.getElementById('authStatus');
  const settingsStatus = document.getElementById('settingsStatus');
  const resumeStatus = document.getElementById('resumeStatus');
  const signOutButton = document.getElementById('signOutButton');
  const projectEditors = [...document.querySelectorAll('[data-project-editor]')];
  const resumeInputs = [...document.querySelectorAll('[data-resume-key]')];
  const tabButtons = [...document.querySelectorAll('[data-admin-tab]')];
  const configReady = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.adminUserId);
  const supabaseApi = window.supabase;
  const client = configReady && supabaseApi?.createClient
    ? supabaseApi.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

  function setStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle('is-error', isError);
  }

  function setAuthenticated(isAuthenticated) {
    loginView.hidden = isAuthenticated;
    dashboardView.hidden = !isAuthenticated;
    signOutButton.hidden = !isAuthenticated;
  }

  function isHttpUrl(value) {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function selectAdminTab(tabName) {
    const showProjects = tabName === 'projects';
    projectsForm.hidden = !showProjects;
    resumeForm.hidden = showProjects;
    tabButtons.forEach((button) => {
      const selected = button.dataset.adminTab === tabName;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
  }

  function setProjectFields(editor, values) {
    const fields = Object.fromEntries([...editor.querySelectorAll('[data-project-field]')]
      .map((input) => [input.dataset.projectField, input]));
    if (typeof values === 'string') {
      fields.url.value = values;
      return;
    }
    if (!values || typeof values !== 'object') return;
    if (typeof values.title === 'string') fields.title.value = values.title;
    if (typeof values.url === 'string') fields.url.value = values.url;
    if (typeof values.description === 'string') fields.description.value = values.description;
    if (Array.isArray(values.technologies)) fields.technologies.value = values.technologies.join(', ');
  }

  async function loadContent() {
    setStatus(settingsStatus, 'Loading saved content...');
    const { data, error } = await client
      .from('portfolio_settings')
      .select('projects,resume')
      .eq('id', 'projects')
      .maybeSingle();

    if (error) {
      setStatus(settingsStatus, error.message, true);
      setStatus(resumeStatus, error.message, true);
      return;
    }

    const projects = data?.projects || {};
    projectEditors.forEach((editor) => {
      setProjectFields(editor, projects[editor.dataset.projectEditor]);
    });
    const resume = data?.resume || {};
    resumeInputs.forEach((input) => {
      if (resume[input.dataset.resumeKey] !== undefined && resume[input.dataset.resumeKey] !== null) {
        input.value = resume[input.dataset.resumeKey];
      }
    });
    setStatus(settingsStatus, 'Saved project content loaded.');
    setStatus(resumeStatus, 'Saved resume content loaded.');
  }

  async function authorize(user) {
    if (!user || user.id !== config.adminUserId) {
      await client.auth.signOut();
      setAuthenticated(false);
      setStatus(authStatus, 'This account is not authorized for the admin workspace.', true);
      return;
    }

    setAuthenticated(true);
    await loadContent();
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => selectAdminTab(button.dataset.adminTab));
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) {
      setStatus(authStatus, 'Admin setup is incomplete. Configure Supabase in admin-config.js and apply admin-schema.sql.', true);
      return;
    }

    const submitButton = loginForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    setStatus(authStatus, 'Signing in...');
    const formData = new FormData(loginForm);
    const { data, error } = await client.auth.signInWithPassword({
      email: formData.get('email'),
      password: formData.get('password')
    });
    submitButton.disabled = false;

    if (error) {
      setStatus(authStatus, error.message, true);
      return;
    }
    await authorize(data.user);
  });

  projectsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;

    const projects = {};
    projectEditors.forEach((editor) => {
      const fields = Object.fromEntries([...editor.querySelectorAll('[data-project-field]')]
        .map((input) => [input.dataset.projectField, input.value.trim()]));
      projects[editor.dataset.projectEditor] = {
        ...fields,
        technologies: fields.technologies.split(',').map((tag) => tag.trim()).filter(Boolean)
      };
    });
    if (Object.values(projects).some((project) => !isHttpUrl(project.url))) {
      setStatus(settingsStatus, 'Use a complete http:// or https:// URL for each destination.', true);
      return;
    }

    const saveButton = projectsForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    setStatus(settingsStatus, 'Saving...');
    const { data, error } = await client
      .from('portfolio_settings')
      .update({ projects, updated_at: new Date().toISOString() })
      .eq('id', 'projects')
      .select('id')
      .maybeSingle();
    saveButton.disabled = false;

    if (error) {
      setStatus(settingsStatus, error.message, true);
      return;
    }
    if (!data) {
      setStatus(settingsStatus, 'Settings row not found. Run admin-schema.sql in Supabase first.', true);
      return;
    }
    setStatus(settingsStatus, 'Saved. Open Projects pages update live when Realtime is enabled.');
  });

  resumeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;

    const resume = Object.fromEntries(resumeInputs.map((input) => [input.dataset.resumeKey, input.value.trim()]));
    const proficiencyKeys = ['skillOnePercent', 'skillTwoPercent', 'skillThreePercent', 'skillFourPercent', 'skillFivePercent', 'skillSixPercent'];
    if (proficiencyKeys.some((key) => {
      const value = Number(resume[key]);
      return !Number.isInteger(value) || value < 0 || value > 100;
    })) {
      setStatus(resumeStatus, 'Proficiency values must be whole numbers from 0 to 100.', true);
      return;
    }

    const saveButton = resumeForm.querySelector('[type="submit"]');
    saveButton.disabled = true;
    setStatus(resumeStatus, 'Saving resume content...');
    const { data, error } = await client
      .from('portfolio_settings')
      .update({ resume, updated_at: new Date().toISOString() })
      .eq('id', 'projects')
      .select('id')
      .maybeSingle();
    saveButton.disabled = false;

    if (error) {
      setStatus(resumeStatus, error.message, true);
      return;
    }
    if (!data) {
      setStatus(resumeStatus, 'Settings row not found. Run admin-schema.sql in Supabase first.', true);
      return;
    }
    setStatus(resumeStatus, 'Saved. Open Resume and Experience pages update live when Realtime is enabled.');
  });

  signOutButton.addEventListener('click', async () => {
    if (client) await client.auth.signOut();
    localStorage.removeItem('ak-admin-gate');
    setAuthenticated(false);
    loginForm.reset();
    setStatus(authStatus, 'Signed out.');
  });

  selectAdminTab('projects');

  if (!configReady || !supabaseApi?.createClient) {
    setStatus(authStatus, 'Admin setup is incomplete. Configure Supabase in admin-config.js and apply admin-schema.sql.', true);
  } else {
    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setStatus(authStatus, error.message, true);
      } else if (data.session) {
        authorize(data.session.user);
      } else {
        setStatus(authStatus, 'Sign in with the admin account provisioned in Supabase.');
      }
    });
  }

  const scene = document.getElementById('adminScene');
  const mascot = document.getElementById('mascot');
  scene.addEventListener('pointermove', (event) => {
    const bounds = mascot.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const lookX = Math.max(-1, Math.min(1, (event.clientX - centerX) / 180));
    const lookY = Math.max(-1, Math.min(1, (event.clientY - centerY) / 180));
    mascot.style.setProperty('--look-x', `${lookX * 7}px`);
    mascot.style.setProperty('--look-y', `${lookY * 5}px`);
    mascot.style.setProperty('--tilt', `${lookX * 4}deg`);
  });
  scene.addEventListener('pointerleave', () => {
    mascot.style.setProperty('--look-x', '0px');
    mascot.style.setProperty('--look-y', '0px');
    mascot.style.setProperty('--tilt', '0deg');
  });
})();
