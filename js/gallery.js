// js/gallery.js —— 图库页：Pinterest 风格砖墙 + 搜索 + 作者/日期/标题筛选 + 全屏预览 + 分页加载
(() => {
  const { IMAGE_DATA, imageUrl, thumbnailUrl, imageDimensions } = window.ImageData;
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

  const PAGE_SIZE = 40; // 每次追加的卡片数量
  const COLUMN_GAP = 14;

  // 筛选状态
  const selectedAuthors = new Set();
  let searchText = '';
  let dateFrom = '';
  let dateTo = '';
  let sortKey = sortEl.value;

  // 分页状态
  let filteredList = [];
  let renderedCount = 0;
  let columns = [];
  let columnHeights = [];

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
      cb.checked = true;
      cb.addEventListener('change', () => toggleAuthor(name, cb.checked));
      const span = document.createElement('span');
      span.textContent = `${name}（${authorCount.get(name)}）`;
      label.appendChild(cb);
      label.appendChild(span);
      authorBox.appendChild(label);
    });
  };

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
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.alt = item.title || item.author || item.file;
    const dimensions = imageDimensions(item.file);
    if (dimensions) {
      img.width = dimensions[0];
      img.height = dimensions[1];
    }

    let fallbackTried = false;
    img.addEventListener('error', () => {
      if (fallbackTried) return;
      fallbackTried = true;
      img.src = imageUrl(item.file);
    });
    img.src = thumbnailUrl(item.file);
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

  const getColumnCount = () => {
    const width = gridEl.clientWidth || window.innerWidth;
    if (width <= 480) return 1;
    if (width <= 760) return 2;
    if (width <= 1100) return 3;
    return 4;
  };

  const createColumns = () => {
    const count = getColumnCount();
    columns = [];
    columnHeights = new Array(count).fill(0);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const column = document.createElement('div');
      column.className = 'gallery-column';
      frag.appendChild(column);
      columns.push(column);
    }
    gridEl.appendChild(frag);
  };

  const estimateCardHeight = (item, columnWidth) => {
    const dimensions = imageDimensions(item.file);
    const ratio = dimensions && dimensions[0] > 0 ? dimensions[1] / dimensions[0] : 1.25;
    // 图片高度 + 卡片间距 + figcaption 的近似高度
    return columnWidth * ratio + COLUMN_GAP + 54;
  };

  // 计算过滤 + 排序后的完整列表
  const getFiltered = () => {
    const kw = searchText.trim().toLowerCase();
    const from = dateFrom ? Number(dateFrom) : NaN;
    const to = dateTo ? Number(dateTo) : NaN;
    let list = IMAGE_DATA.filter(item => {
      if (selectedAuthors.size < authors.length && selectedAuthors.has(item.author || '未知')) return false;
      if (!Number.isNaN(from) && item.year && item.year < from) return false;
      if (!Number.isNaN(to) && item.year && item.year > to) return false;
      if (kw) {
        const haystack = `${item.title} ${item.author} ${item.date}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });

    list = list.sort((a, b) => {
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

  // 加载下一批卡片
  const loadMore = (batchSize = PAGE_SIZE) => {
    if (renderedCount >= filteredList.length) return;
    const end = Math.min(renderedCount + batchSize, filteredList.length);
    const columnWidth = (gridEl.clientWidth - COLUMN_GAP * (columns.length - 1)) / columns.length;
    for (let i = renderedCount; i < end; i++) {
      let shortest = 0;
      for (let c = 1; c < columnHeights.length; c++) {
        if (columnHeights[c] < columnHeights[shortest]) shortest = c;
      }
      const item = filteredList[i];
      columns[shortest].appendChild(createCard(item));
      columnHeights[shortest] += estimateCardHeight(item, columnWidth);
    }
    renderedCount = end;
    updateCount();
  };

  // 更新计数
  const updateCount = () => {
    countEl.textContent = `共 ${filteredList.length} / ${IMAGE_DATA.length} 张（已加载 ${renderedCount}）`;
  };

  // 重新渲染：重置分页
  const render = () => {
    filteredList = getFiltered();
    gridEl.innerHTML = '';
    columns = [];
    columnHeights = [];
    renderedCount = 0;
    emptyEl.hidden = filteredList.length > 0;
    if (filteredList.length > 0) {
      createColumns();
      loadMore();
    }
    else countEl.textContent = `共 0 / ${IMAGE_DATA.length} 张`;
  };

  // ==== IntersectionObserver 滚动加载 ====
  const sentinel = document.createElement('div');
  sentinel.id = 'scrollSentinel';
  sentinel.style.height = '1px';
  gridEl.parentNode.insertBefore(sentinel, gridEl.nextSibling);

  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && renderedCount < filteredList.length) {
      loadMore();
    }
  }, { rootMargin: '200px' });
  io.observe(sentinel);

  // 滚动事件兜底：当 body 作为滚动容器时 IntersectionObserver 可能不触发
  window.addEventListener('scroll', () => {
    if (renderedCount >= filteredList.length) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= scrollable - 300) loadMore();
  }, { passive: true });

  // 仅在列数断点变化时重建当前已加载部分，避免普通窗口缩放时反复重排。
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (getColumnCount() === columns.length) return;
      const loaded = renderedCount;
      filteredList = getFiltered();
      gridEl.innerHTML = '';
      columns = [];
      columnHeights = [];
      renderedCount = 0;
      createColumns();
      loadMore(loaded);
    }, 160);
  }, { passive: true });

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
    document.body.style.overflow = 'hidden';
  };

  const openLightbox = (item) => {
    currentList = filteredList;
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

  // ==== 事件绑定（搜索加防抖） ====
  let debounceTimer = null;
  const debouncedRender = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, 200);
  };

  searchEl.addEventListener('input', () => { searchText = searchEl.value; debouncedRender(); });
  dateFromEl.addEventListener('input', () => { dateFrom = dateFromEl.value; debouncedRender(); });
  dateToEl.addEventListener('input', () => { dateTo = dateToEl.value; debouncedRender(); });
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
