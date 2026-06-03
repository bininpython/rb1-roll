import { supabase } from './supabase';

const $ = (id: string) => document.getElementById(id)!;

export type UserRole = 'viewer' | 'editor' | 'admin';
export let currentUserRole: UserRole = 'editor';

export function initAuth() {
  const loginSection = $('app-login');
  const loginCard = $('loginCard');
  const dashboardSection = $('app-dashboard');
  const loginForm = $('loginForm') as HTMLFormElement;
  const loginEmail = $('loginEmail') as HTMLInputElement; // actually loginId now
  const loginPassword = $('loginPassword') as HTMLInputElement;
  const btnLoginSubmit = $('btnLoginSubmit') as HTMLButtonElement;
  const loginError = $('loginError');
  const btnLogout = $('btnLogout');

  // Helper para mostrar erros no login
  function showError(msg: string) {
    if(!loginError) return;
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
    setTimeout(() => loginError.classList.add('hidden'), 5000);
  }

  const ID_MAPPING: Record<string, string> = {
    'rb11000vw': 'rb1.viewer@aperam.com',
    'rb12000ed': 'rb1.editor@aperam.com',
    'rb13000ad': 'rb1.admin@aperam.com'
  };

  // Lógica de Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawLoginId = loginEmail.value.trim().toLowerCase();
      const loginId = rawLoginId.replace(/[\s-]/g, ''); // Remove espaços e hífens
      const password = loginPassword.value.trim();

      if (!loginId || !password) return;

      const mappedEmail = ID_MAPPING[loginId];
      const email = mappedEmail ? mappedEmail : `${loginId}@aperam.com`;

      // Estado de loading
      const originalText = btnLoginSubmit.innerHTML;
      btnLoginSubmit.innerHTML = `<span class="material-symbols-outlined animate-spin">refresh</span> Entrando...`;
      btnLoginSubmit.disabled = true;

      let { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Auto-cadastro para os usuários padrão se não existirem
      if (error && error.message.includes('Invalid login credentials')) {
        if (mappedEmail) {
          console.log(`Auto-cadastrando o usuário padrão ${loginId}...`);
          const signUpRes = await supabase.auth.signUp({ email, password });
          if (signUpRes.error) {
            error = signUpRes.error;
          } else if (!signUpRes.data.session) {
            error = { message: 'Confirmação de e-mail obrigatória ativada no Supabase. Desative-a no painel (Auth > Providers > Email).' } as any;
          } else {
            error = null; // Sucesso no auto-cadastro, logado!
          }
        }
      }

      if (error) {
        showError(error.message === 'Invalid login credentials' ? 'Credenciais incorretas.' : error.message);
        btnLoginSubmit.innerHTML = originalText;
        btnLoginSubmit.disabled = false;
      }
    });
  }

  // Lógica de Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await supabase.auth.signOut();
    });
  }

  // Escutar mudanças de estado de autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Deduzir a role baseada no email (ex: admin@aperam.com -> admin)
      const email = session.user.email || '';
      if (email.includes('admin')) currentUserRole = 'admin';
      else if (email.includes('editor')) currentUserRole = 'editor';
      else currentUserRole = 'editor';

      // Dispara evento para main.ts aplicar as permissões na UI
      window.dispatchEvent(new CustomEvent('authRoleChanged', { detail: currentUserRole }));

      // Usuário logado - animar e mostrar painel
      loginCard?.classList.replace('scale-100', 'scale-95');
      loginSection?.classList.replace('opacity-100', 'opacity-0');
      
      setTimeout(() => {
        if(loginSection) loginSection.style.display = 'none';
        if(dashboardSection) dashboardSection.style.display = 'flex';
      }, 300);
    } else {
      // Usuário deslogado
      if(dashboardSection) dashboardSection.style.display = 'flex';
      if(loginSection) loginSection.style.display = 'none';
      
      currentUserRole = 'editor';
      window.dispatchEvent(new CustomEvent('authRoleChanged', { detail: currentUserRole }));

      // Reseta a opacidade e escala
      setTimeout(() => {
        loginSection?.classList.replace('opacity-0', 'opacity-100');
        loginCard?.classList.replace('scale-95', 'scale-100');
        if (loginForm) loginForm.reset();
        if (btnLoginSubmit) {
          btnLoginSubmit.innerHTML = `<span>Entrar</span><span class="material-symbols-outlined text-[18px]">login</span>`;
          btnLoginSubmit.disabled = false;
        }
      }, 50);
    }
  });
}
