// js/gallery.js —— 图库页：Pinterest 风格砖墙 + 搜索 + 作者/日期/标题筛选 + 全屏预览
(() => {
  const { IMAGE_FOLDER, IMAGE_DATA, imageUrl } = window.ImageData;
  if (!IMAGE_DATA || !IMAGE_DATA.length) return;

  const gridEl = document.getElementById('galleryGrid');
  const countEl = document.getElementById('galleryCount');
  const emptyEl = document.getElementById('emptyState');
  const searchEl = document.getElementById('searchInput');
  const dateFromEl = document.getElementById('dateFrom');
  const dateToEl = document.getElementById('dateTo');
  const sortEl = document.getElementById('sortSelect');
  const filterPanel = document.getElementById('filterPanel');
  const filterToggle = document.getElementById('filterToggle');
  const authorBox = document.getElementById('authorFilters');

  // 筛选状态：selectedAuthors 记录被取消勾选的作者（空集合 = 显示全部）
  const selectedAuthors = new Set();
  let searchText = '';
  let dateFrom = '';
  let dateTo = '';
  let sortKey = sortEl.value;

  // 统计每个作者的作品数量
  const authorCount = new Map();
  IMAGE_DATA.forEach(item => {
    const key = item.author || '未知';
    authorCount.set(key, (authorCount.get(key) || 0) + 1);
  });
  const authors = [...authorCount.keys()].sort((a, b) => authorCount.get(b) - authorCount.get(a));

  // 渲染作者筛选复选框
  const renderAuthorFilters = () => {
    authorBox.innerHTML = '';
    authors.forEach(name => {
      const label = document.createElement('label');
      label.className = 'author-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = name;
      cb.checked = true; // 默认全选
      cb.addEventListener('change', () => toggleAuthor(name, cb.checked));
      const span = document.createElement('span');
      span.textContent = `${name}（${authorCount.get(name)}）`;
      label.appendChild(cb);
      label.appendChild(span);
      authorBox.appendChild(label);
    });
  };

  // 勾选/取消作者
  const toggleAuthor = (name, checked) => {
    if (checked) selectedAuthors.delete(name);
    else selectedAuthors.add(name);
    render();
  };

  // 生成单张卡片
  const createCard = (item) => {
    const card = document.createElement('figure');
    card.className = 'card';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = item.title || item.author || item.file;
    img.src = imageUrl(item.file);
    img.addEventListener('click', () => openLightbox(item));

    const fig = document.createElement('figcaption');
    if (item.title) {
      const t = document.createElement('p');
      t.className = 'card-title';
      t.textContent = item.title;
      fig.appendChild(t);
    }
    const meta = document.createElement('p');
    meta.className = 'card-meta';
    const parts = [];
    if (item.author) parts.push(item.author);
    if (item.date) parts.push(item.date);
    meta.textContent = parts.join('·');
    fig.appendChild(meta);

    card.appendChild(img);
    card.appendChild(fig);
    return card;
  };

  // 计算当前过滤 + 排序后的数据
  const getFiltered = () => {
    const kw = searchText.trim().toLowerCase();
    const from = dateFrom ? Number(dateFrom) : NaN;
    const to = dateTo ? Number(dateTo) : NaN;
    let list = IMAGE_DATA.filter(item => {
      // 作者筛选：有选中即只显示这些作者
      if (selectedAuthors.size < authors.length && selectedAuthors.has(item.author || '未知')) return false;
      // 日期范围筛选
      if (!Number.isNaN(from) && item.year && item.year < from) return false;
      if (!Number.isNaN(to) && item.year && item.year > to) return false;
      // 关键词搜索：标题/作者/日期
      if (kw) {
        const haystack = `${item.title} ${item.author} ${item.date}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });

    // 排序
    list = list.slice().sort((a, b) => {
      switch (sortKey) {
        case 'date-asc':
          return (a.year || 0) - (b.year || 0) || a.file.localeCompare(b.file);
        case 'author':
          return (a.author || '').localeCompare(b.author || '') || a.file.localeCompare(b.file);
        case 'name':
          return a.file.localeCompare(b.file);
        case 'date-desc':
        default:
          return (b.year || 0) - (a.year || 0) || a.file.localeCompare(b.file);
      }
    });
    return list;
  };

  // 渲染网格
  const render = () => {
    const list = getFiltered();
    gridEl.innerHTML = '';
    list.forEach(item => gridEl.appendChild(createCard(item)));
    countEl.textContent = `共 ${list.length} / ${IMAGE_DATA.length} 张`;
    emptyEl.hidden = list.length > 0;
  };

  // ==== 全屏预览 ====
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  let currentList = [];
  let currentIndex = 0;

  const showLightbox = (index) => {
    const item = currentList[index];
    if (!item) return;
    currentIndex = index;
    lightboxImg.src = imageUrl(item.file);
    lightboxImg.alt = item.title || item.author || item.file;
    const parts = [];
    if (item.title) parts.push(item.title);
    if (item.author) parts.push(item.author);
    if (item.date) parts.push(item.date);
    lightboxCaption.textContent = parts.join(' · ');
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden'; // 预览时锁定背景滚动
  };

  const openLightbox = (item) => {
    currentList = getFiltered();
    showLightbox(currentList.indexOf(item));
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  };

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.getElementById('lightboxPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    showLightbox((currentIndex - 1 + currentList.length) % currentList.length);
  });
  document.getElementById('lightboxNext').addEventListener('click', (e) => {
    e.stopPropagation();
    showLightbox((currentIndex + 1) % currentList.length);
  });
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showLightbox((currentIndex - 1 + currentList.length) % currentList.length);
    else if (e.key === 'ArrowRight') showLightbox((currentIndex + 1) % currentList.length);
  });

  // 事件绑定
  searchEl.addEventListener('input', () => { searchText = searchEl.value; render(); });
  dateFromEl.addEventListener('input', () => { dateFrom = dateFromEl.value; render(); });
  dateToEl.addEventListener('input', () => { dateTo = dateToEl.value; render(); });
  sortEl.addEventListener('change', () => { sortKey = sortEl.value; render(); });
  filterToggle.addEventListener('click', () => {
    filterPanel.hidden = !filterPanel.hidden;
  });
  document.getElementById('selectAll').addEventListener('click', () => {
    selectedAuthors.clear();
    authorBox.querySelectorAll('input').forEach(cb => { cb.checked = true; });
    render();
  });
  document.getElementById('clearAll').addEventListener('click', () => {
    authors.forEach(a => selectedAuthors.add(a));
    authorBox.querySelectorAll('input').forEach(cb => { cb.checked = false; });
    render();
  });

  // 初始化
  renderAuthorFilters();
  render();
})();