// DOM 元素
const themeToggle = document.getElementById('theme-toggle');
const searchToggle = document.getElementById('search-toggle');
const moreToggle = document.getElementById('more-toggle');
const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const leaderboardPage = document.getElementById('leaderboard-page');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const autoLoginCheckbox = document.getElementById('auto-login');
const loginBtn = document.getElementById('login-btn');
const addStudentBtn = document.getElementById('add-student-btn');
const batchAddBtn = document.getElementById('batch-add-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const backBtn = document.getElementById('back-btn');
const screenshotBtn = document.getElementById('screenshot-btn');
const studentsList = document.getElementById('students-list');
const rankedList = document.getElementById('ranked-list');
const closeNoticeBtn = document.getElementById('close-notice');
const fileInput = document.getElementById('file-input');


// ========== 配置加载 ==========
let config = {
  login: true,
  username: 'admin',
  password: '1q2w3e4r',
  notice: true
};

// 读取 scoringpad.json 配置
async function loadConfig() {
  try {
    const res = await fetch('scoringpad.json?_=' + Date.now());
    if (res.ok) {
      const json = await res.json();
      config = Object.assign(config, json);
    }
  } catch (e) {
    // 读取失败则用默认配置
    console.warn('配置文件读取失败，使用默认配置', e);
  }
}

// ========== 主题管理 ==========
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeToggle.textContent = isDark ? '🌙' : '☀️';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon();
}

function getPreferredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

if (searchToggle) {
  searchToggle.addEventListener('click', openSearch);
}

// 更多按钮事件绑定
if (moreToggle) {
  moreToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMoreMenu();
  });
}

// 初始化主题
setTheme(getPreferredTheme());

// ========== 页面切换 ==========
function showLoginPage() {
  loginPage.classList.remove('hidden');
  dashboardPage.classList.add('hidden');
  leaderboardPage.classList.add('hidden');
}

function showDashboardPage() {
  loginPage.classList.add('hidden');
  dashboardPage.classList.remove('hidden');
  leaderboardPage.classList.add('hidden');
  renderStudents();
  // 根据配置设置大标题
  if (config.title) {
    // dashboard-page h1
    const dashTitle = dashboardPage.querySelector('h1');
    if (dashTitle) {
      dashTitle.textContent = `欢迎使用${config.title}！`;
    }
    // login-page h2
    const loginTitle = loginPage.querySelector('h2');
    if (loginTitle) {
      loginTitle.textContent = config.title;
    }
  }
  // 根据配置显示/隐藏 notice-box，并设置内容
  const noticeBox = document.getElementById('notice-box');
  if (noticeBox) {
    noticeBox.style.display = config.notice ? '' : 'none';
    if (typeof config.notice === 'string') {
      // 支持自定义内容
      // 保留关闭按钮
      const closeBtn = noticeBox.querySelector('.close-btn');
      noticeBox.innerHTML = '';
      if (closeBtn) noticeBox.appendChild(closeBtn);
      // 插入自定义内容
      const content = document.createElement('div');
      content.innerHTML = config.notice;
      noticeBox.appendChild(content);
    }
  }
}

function showLeaderboardPage() {
  loginPage.classList.add('hidden');
  dashboardPage.classList.add('hidden');
  leaderboardPage.classList.remove('hidden');
  renderLeaderboard();
}

// ========== 搜索功能 ==========
let _searchBarEl = null;

function openSearch() {
  // 隐藏顶栏按钮（主题、搜索、更多）
  if (themeToggle) themeToggle.style.display = 'none';
  if (searchToggle) searchToggle.style.display = 'none';
  if (moreToggle) moreToggle.style.display = 'none';

  // 已经打开则聚焦输入
  if (_searchBarEl) {
    const inp = document.getElementById('global-search');
    if (inp) inp.focus();
    return;
  }

  // 创建搜索条
  const bar = document.createElement('div');
  bar.id = 'search-bar';

  const input = document.createElement('input');
  input.id = 'global-search';
  input.className = 'search-input';
  input.placeholder = '搜索学生姓名...';
  input.autocomplete = 'off';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'search-close-btn';
  closeBtn.type = 'button';
  closeBtn.innerText = '❌';

  bar.appendChild(input);
  bar.appendChild(closeBtn);
  document.body.appendChild(bar);
  _searchBarEl = bar;

  // 事件
  input.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });
  closeBtn.addEventListener('click', closeSearch);

  // 自动聚焦
  setTimeout(() => input.focus(), 50);
}

function closeSearch() {
  if (_searchBarEl) {
    _searchBarEl.remove();
    _searchBarEl = null;
  }
  if (themeToggle) themeToggle.style.display = '';
  if (searchToggle) searchToggle.style.display = '';
  if (moreToggle) moreToggle.style.display = '';
  // 恢复全量渲染
  if (!dashboardPage.classList.contains('hidden')) {
    renderStudents();
  }
  if (!leaderboardPage.classList.contains('hidden')) {
    renderLeaderboard();
  }
}

function performSearch(query) {
  const q = (query || '').trim();
  if (!dashboardPage.classList.contains('hidden')) {
    renderStudents(q);
  } else if (!leaderboardPage.classList.contains('hidden')) {
    renderLeaderboard(q);
  }
}

// ========== 更多菜单功能 ==========
let _moreMenuEl = null;

function createMoreMenu() {
  if (_moreMenuEl) return _moreMenuEl;
  const menu = document.createElement('div');
  menu.id = 'more-menu';

  const clearItem = document.createElement('div');
  clearItem.className = 'more-item';
  clearItem.innerText = '🗑️  清空数据';
  clearItem.addEventListener('click', (e) => {
    e.stopPropagation();
    handleClearData();
  });

  const aboutItem = document.createElement('div');
  aboutItem.className = 'more-item';
  aboutItem.innerText = 'ℹ  关于';
  aboutItem.addEventListener('click', (e) => {
    e.stopPropagation();
    handleAbout();
  });

  menu.appendChild(clearItem);
  menu.appendChild(aboutItem);
  document.body.appendChild(menu);
  _moreMenuEl = menu;
  return menu;
}

function toggleMoreMenu() {
  if (_moreMenuEl) {
    closeMoreMenu();
    return;
  }
  const menu = createMoreMenu();
  // 保证位置靠近更多按钮（样式也已设置），并监听外部点击关闭
  setTimeout(() => document.addEventListener('click', _docClickCloseMore), 0);
}

function closeMoreMenu() {
  if (_moreMenuEl) {
    _moreMenuEl.remove();
    _moreMenuEl = null;
    document.removeEventListener('click', _docClickCloseMore);
  }
}

function _docClickCloseMore(ev) {
  if (!_moreMenuEl) return;
  const target = ev.target;
  if (moreToggle && (moreToggle === target || moreToggle.contains(target))) return;
  if (_moreMenuEl.contains(target)) return;
  closeMoreMenu();
}

function handleAbout() {
  closeMoreMenu();
  const aboutText = config['about-info'] || config.about || 'Scoring Pad - 本地计分管理系统。';
  alert(aboutText);
}

function generateConfirmCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function handleClearData() {
  closeMoreMenu();
  const ok = confirm('⚠确认清除所有学生记分数据吗？清除之后将无法恢复！');
  if (!ok) return;

  const code = generateConfirmCode();
  const input = prompt(`⌨请完整重复输入【${code}】以确认删除`);
  if (input === null) return; // 取消
  if (input !== code) {
    alert('❌输入内容不匹配，请重新操作！');
    return;
  }

  const finalOk = confirm('☢最后一次确认！确定要完全清除学生数据吗？清除后将永远不能恢复，永远！数据无价，谨慎操作！\nℹ 建议您清除前使用导出CSV功能进行备份，避免出现不必要的损失。');
  if (!finalOk) return;

  // 执行清空
  saveStudents([]);
  // 如果当前在页面，刷新视图
  if (!dashboardPage.classList.contains('hidden')) renderStudents();
  if (!leaderboardPage.classList.contains('hidden')) renderLeaderboard();
  alert('✔ 清除完成！');
}

// ========== 数据存储 ==========
function loadStudents() {
  const data = localStorage.getItem('students');
  return data ? JSON.parse(data) : [];
}

function saveStudents(students) {
  localStorage.setItem('students', JSON.stringify(students));
}

// ========== 渲染 ==========
function renderStudents(filter) {
  const all = loadStudents();
  const q = filter ? filter.toLowerCase() : '';
  const list = all
    .map((s, i) => ({ s, i }))
    .filter(item => (q ? item.s.name.toLowerCase().includes(q) : true));

  studentsList.innerHTML = '';

  list.forEach(({ s: student, i: originalIndex }) => {
    const div = document.createElement('div');
    div.className = 'student-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'student-name';
    nameSpan.textContent = student.name;

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'student-score';
    scoreSpan.textContent = student.score;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'student-actions';

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.title = '加分';
    addBtn.onclick = () => handleAddScore(originalIndex);

    const minusBtn = document.createElement('button');
    minusBtn.className = 'minus-btn';
    minusBtn.title = '扣分';
    minusBtn.onclick = () => handleMinusScore(originalIndex);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn';
    resetBtn.title = '清零';
    resetBtn.onclick = () => handleResetScore(originalIndex);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = '删除学生';
    deleteBtn.onclick = () => handleDeleteStudent(originalIndex);

    actionsDiv.appendChild(addBtn);
    actionsDiv.appendChild(minusBtn);
    actionsDiv.appendChild(resetBtn);
    actionsDiv.appendChild(deleteBtn);

    div.appendChild(nameSpan);
    div.appendChild(scoreSpan);
    div.appendChild(actionsDiv);

    studentsList.appendChild(div);
  });
}

function renderLeaderboard() {
  const all = loadStudents();
  const q = arguments.length > 0 && arguments[0] ? String(arguments[0]).toLowerCase() : '';

  // 包含原始索引以便稳定排序和可能的扩展
  const mapped = all.map((s, i) => ({ s, i }));
  // 按分数降序排序（稳定）
  const sorted = mapped.sort((a, b) => b.s.score - a.s.score);
  const filtered = q ? sorted.filter(item => item.s.name.toLowerCase().includes(q)) : sorted;

  rankedList.innerHTML = '';

  filtered.forEach((item, idx) => {
    const student = item.s;
    const div = document.createElement('div');
    div.className = 'rank-item';

    const rankSpan = document.createElement('span');
    rankSpan.className = 'rank';
    rankSpan.textContent = (idx + 1) + '.';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'rank-name';
    nameSpan.textContent = student.name;

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'rank-score';
    scoreSpan.textContent = student.score;

    div.appendChild(rankSpan);
    div.appendChild(nameSpan);
    div.appendChild(scoreSpan);
    rankedList.appendChild(div);
  });
}

// ========== 功能 ==========
addStudentBtn.addEventListener('click', () => {
  const name = prompt('请输入学生姓名：');
  if (name && name.trim()) {
    const students = loadStudents();
    students.push({ name: name.trim(), score: 0 });
    saveStudents(students);
    renderStudents();
  }
});

// ✅ 支持中文逗号（，）、顿号（、）、英文逗号（,）
batchAddBtn.addEventListener('click', () => {
  const input = prompt('请输入学生姓名，可用中文逗号“，”、顿号“、”或英文逗号“,”分隔：');
  if (!input) return;
  const names = input.split(/[,，、]/).map(n => n.trim()).filter(n => n !== '');
  if (names.length === 0) {
    alert('未检测到有效姓名。');
    return;
  }
  const students = loadStudents();
  names.forEach(name => students.push({ name, score: 0 }));
  saveStudents(students);
  renderStudents();
  alert(`成功添加 ${names.length} 名学生！`);
});

// CSV 导出
exportCsvBtn.addEventListener('click', () => {
  const students = loadStudents();
  if (students.length === 0) {
    alert('没有学生数据可导出！');
    return;
  }

  let csvContent = '姓名,分数\n';
  csvContent += students.map(s => `"${s.name}",${s.score}`).join('\n');

  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = '计分数据.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// CSV 导入
importCsvBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      alert('CSV 文件格式错误或为空！');
      return;
    }

    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const match = line.match(/^"([^"]*)",(.+)$/);
      if (match) {
        const name = match[1];
        const score = parseFloat(match[2]);
        if (!isNaN(score) && name) {
          students.push({ name, score });
        }
      } else {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const score = parseFloat(parts[1]);
          if (!isNaN(score) && name) {
            students.push({ name, score });
          }
        }
      }
    }

    if (students.length === 0) {
      alert('未解析到有效学生数据！');
      return;
    }

    saveStudents(students);
    renderStudents();
    alert(`成功导入 ${students.length} 名学生！`);
  };
  reader.readAsText(file, 'utf-8');
  e.target.value = '';
});

// ========== 操作 ==========
function handleAddScore(index) {
  const students = loadStudents();
  const scoreStr = prompt(`为【${students[index].name}】加分，请输入加分值：`);
  if (scoreStr === null) return;
  const score = parseFloat(scoreStr);
  if (!isNaN(score)) {
    students[index].score += score;
    saveStudents(students);
    renderStudents();
  } else {
    alert('请输入有效的数字！');
  }
}

function handleMinusScore(index) {
  const students = loadStudents();
  const scoreStr = prompt(`为【${students[index].name}】扣分，请输入扣分值：`);
  if (scoreStr === null) return;
  const score = parseFloat(scoreStr);
  if (!isNaN(score)) {
    students[index].score -= score;
    saveStudents(students);
    renderStudents();
  } else {
    alert('请输入有效的数字！');
  }
}

function handleResetScore(index) {
  if (confirm('确定要将该学生的分数清零吗？')) {
    const students = loadStudents();
    students[index].score = 0;
    saveStudents(students);
    renderStudents();
  }
}

function handleDeleteStudent(index) {
  if (confirm('确定要删除该学生及其所有记录吗？')) {
    const students = loadStudents();
    students.splice(index, 1);
    saveStudents(students);
    renderStudents();
  }
}

// ========== 截屏功能 ==========
screenshotBtn.addEventListener('click', async () => {
  try {
    const element = document.getElementById('ranked-list');
    if (!element || element.children.length === 0) {
      alert('排行榜为空，无法截图！');
      return;
    }

    // 创建一个临时容器，包含标题和列表
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg');
    container.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    container.style.fontFamily = 'Microsoft YaHei, sans-serif';
    container.style.fontSize = '18px';
    container.style.width = '600px';

    const title = document.createElement('h2');
    title.textContent = '🏆 计分排行榜';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    container.appendChild(title);
    container.appendChild(element.cloneNode(true));

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: null,
      useCORS: true
    });

    document.body.removeChild(container);

    const link = document.createElement('a');
    link.download = '排行榜.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('截屏失败:', err);
    alert('截屏失败，请稍后重试。');
  }
});

// ========== UI 交互 ==========
closeNoticeBtn.addEventListener('click', () => {
  document.getElementById('notice-box').style.display = 'none';
});

leaderboardBtn.addEventListener('click', showLeaderboardPage);
backBtn.addEventListener('click', showDashboardPage);

// ========== 登录 ==========
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (username === config.username && password === config.password) {
    if (autoLoginCheckbox.checked) {
      localStorage.setItem('autoLogin', 'true');
    } else {
      localStorage.removeItem('autoLogin');
    }
    showDashboardPage();
  } else {
    alert('用户名或密码错误！');
  }
});

// ========== 初始化 ==========
window.addEventListener('load', async () => {
  await loadConfig();
  // 将自定义标题应用到浏览器标签页
  if (config.title) {
    document.title = `欢迎使用${config.title}！`;
  }
  // 登录页面显示控制
  if (config.login) {
    // 支持自动登录
    const autoLogin = localStorage.getItem('autoLogin') === 'true';
    if (autoLogin) {
      showDashboardPage();
    } else {
      showLoginPage();
    }
  } else {
    // 不需要登录，直接进入管理页面
    showDashboardPage();
    loginPage.style.display = 'none';
  }
});