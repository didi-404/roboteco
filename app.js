const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

function toast(message) {
  let box = $('.toast');
  if (!box) {
    box = document.createElement('div');
    box.className = 'toast';
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 2600);
}

function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'home.html';
  $$('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === 'index.html' && href === 'home.html')) a.classList.add('active');
  });
}

function bootTheme() {
  const saved = store.get('roboteco-theme', 'light');
  if (saved === 'dark') document.body.classList.add('dark');
  $$('.theme-toggle').forEach(btn => btn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    store.set('roboteco-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    toast(document.body.classList.contains('dark') ? 'Modo laboratório noturno ativado!' : 'Modo claro ativado!');
  }));
}

function bootMobileMenu() {
  const btn = $('.hamb');
  const menu = $('.mobile-nav');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('show'));
}

function animateProgress() {
  $$('.progress [data-progress]').forEach(bar => {
    const value = Math.max(0, Math.min(100, Number(bar.dataset.progress || 0)));
    setTimeout(() => bar.style.width = value + '%', 120);
  });
}

function bootModal() {
  const modal = $('#videoModal');
  if (!modal) return;
  $$('.play, [data-open-video]').forEach(btn => btn.addEventListener('click', () => {
    modal.classList.add('show');
    const title = btn.dataset.title || 'Prévia da aula Roboteco';
    $('.modal-title', modal).textContent = title;
  }));
  $$('.close-modal, .modal').forEach(el => el.addEventListener('click', e => {
    if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) modal.classList.remove('show');
  }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('show'); });
}

function bootLessonFilters() {
  const tabs = $$('.lesson-filter .tab');
  if (!tabs.length) return;
  const cards = $$('.lesson-card');
  const empty = $('.empty-state');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    let visible = 0;
    cards.forEach(card => {
      const ok = filter === 'todos' || card.dataset.category === filter;
      card.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    empty?.classList.toggle('show', visible === 0);
  }));
}

function bootGameFilters() {
  const board = $('.game-list');
  if (!board) return;
  const checkboxes = $$('.game-check');
  const diffs = $$('.diff-btn');
  const viewBtns = $$('.view-btn');
  const cards = $$('.game-card');
  let currentDiff = 'todos';
  function apply() {
    const cats = checkboxes.filter(c => c.checked).map(c => c.value);
    let visible = 0;
    cards.forEach(card => {
      const catOk = cats.includes('todos') || cats.includes(card.dataset.category);
      const diffOk = currentDiff === 'todos' || card.dataset.difficulty === currentDiff;
      const ok = catOk && diffOk;
      card.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    $('.empty-state')?.classList.toggle('show', visible === 0);
  }
  checkboxes.forEach(chk => chk.addEventListener('change', () => {
    if (chk.value === 'todos' && chk.checked) checkboxes.filter(c => c !== chk).forEach(c => c.checked = false);
    if (chk.value !== 'todos' && chk.checked) checkboxes.find(c => c.value === 'todos').checked = false;
    if (!checkboxes.some(c => c.checked)) checkboxes.find(c => c.value === 'todos').checked = true;
    apply();
  }));
  diffs.forEach(btn => btn.addEventListener('click', () => {
    diffs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDiff = btn.dataset.diff;
    apply();
  }));
  viewBtns.forEach(btn => btn.addEventListener('click', () => {
    viewBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    board.classList.toggle('list', btn.dataset.view === 'list');
  }));
}

function bootSteps() {
  const steps = $$('.step-card');
  if (!steps.length) return;
  steps.forEach((step, i) => step.addEventListener('click', () => {
    steps.forEach(s => s.classList.remove('active'));
    step.classList.add('active');
    if (i > 0) toast('Etapa selecionada. Confira as instruções antes de concluir.');
  }));
  $('#finishLesson')?.addEventListener('click', () => {
    steps.forEach(s => s.classList.add('completed'));
    const xp = store.get('roboteco-xp', 1250) + 250;
    store.set('roboteco-xp', xp);
    store.set('roboteco-last-completed', new Date().toISOString());
    toast('Atividade concluída! +250 XP adicionados ao seu perfil.');
    $('#finishLesson').textContent = 'Atividade Concluída ✓';
  });
}

function bootForms() {
  $$('form[data-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const type = form.dataset.form;
      if (type === 'login') {
        const email = form.querySelector('[name=email]').value.trim();
        if (!email.includes('@')) return toast('Digite um e-mail válido para entrar.');
        store.set('roboteco-user', { email, name: email.split('@')[0] });
        toast('Login simulado com sucesso! Redirecionando para a home...');
        setTimeout(() => location.href = 'home.html', 900);
      }
      if (type === 'cadastro') {
        const name = form.querySelector('[name=nome]').value.trim();
        const pass = form.querySelector('[name=senha]').value.trim();
        const terms = form.querySelector('[name=termos]').checked;
        if (name.length < 3) return toast('Preencha seu nome completo.');
        if (pass.length < 8) return toast('A senha precisa ter no mínimo 8 caracteres.');
        if (!terms) return toast('Aceite os termos para continuar.');
        store.set('roboteco-user', { name });
        toast('Cadastro criado! Bem-vindo ao laboratório Roboteco.');
        setTimeout(() => location.href = 'home.html', 900);
      }
      if (type === 'admin') {
        const data = new FormData(form);
        addAgendaItem(data);
        form.reset();
        toast('Aula agendada e adicionada à agenda da semana!');
      }
    });
  });
}

function addAgendaItem(data) {
  const dayValue = data.get('data') || '';
  const date = dayValue ? new Date(dayValue + 'T00:00:00') : new Date();
  const weekDay = ['dom','seg','ter','qua','qui','sex','sab'][date.getDay()];
  const target = document.querySelector(`[data-day="${weekDay}"]`) || document.querySelector('[data-day="ter"]');
  if (!target) return;
  const div = document.createElement('div');
  div.className = Number(data.get('hora')?.slice(0,2)) >= 14 ? 'class-chip orange' : 'class-chip';
  div.innerHTML = `<strong>${data.get('kit') || 'Nova aula'}</strong><br>${data.get('hora') || '--:--'} - ${data.get('lab') || 'Lab'}`;
  target.appendChild(div);
  const metric = $('#todayClasses');
  if (metric) metric.textContent = String(Number(metric.textContent || 0) + 1).padStart(2, '0');
}

function bootStudentSearch() {
  const input = $('#studentSearch');
  if (!input) return;
  const students = $$('.student');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    students.forEach(s => s.style.display = s.textContent.toLowerCase().includes(q) ? '' : 'none');
  });
}

function bootIdeas() {
  const form = $('#ideaForm');
  const wrap = $('#ideasWrap');
  if (!form || !wrap) return;
  const initial = store.get('roboteco-ideas', [
    'Criar um robô que segue linha sozinho.',
    'Adicionar ranking semanal de missões.',
    'Ter um modo desafio em duplas.'
  ]);
  function render() {
    wrap.innerHTML = '';
    initial.slice(-8).forEach(text => {
      const n = document.createElement('div');
      n.className = 'note';
      n.textContent = text;
      wrap.appendChild(n);
    });
  }
  render();
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = $('#ideaInput').value.trim();
    if (text.length < 4) return toast('Escreva uma sugestão um pouco maior.');
    initial.push(text);
    store.set('roboteco-ideas', initial);
    $('#ideaInput').value = '';
    render();
    toast('Sua sugestão foi pregada no quadro!');
  });
}

function bootXP() {
  const xp = store.get('roboteco-xp', 1250);
  $$('[data-xp-text]').forEach(el => el.textContent = xp + ' XP');
  const percent = Math.min(100, Math.round((xp / 1500) * 100));
  $$('[data-xp-progress]').forEach(el => {
    el.dataset.progress = percent;
    el.style.width = percent + '%';
  });
}

function bootPasswords() {
  $$('.toggle-password').forEach(btn => btn.addEventListener('click', () => {
    const input = btn.closest('.password-wrap')?.querySelector('input');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  bootTheme();
  bootMobileMenu();
  animateProgress();
  bootModal();
  bootLessonFilters();
  bootGameFilters();
  bootSteps();
  bootForms();
  bootStudentSearch();
  bootIdeas();
  bootXP();
  bootPasswords();
});
