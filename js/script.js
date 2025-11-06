(() => {
  const IMAGE_FOLDER = 'images/';
  
  // 示例图片（按你的规则命名即可）
  const IMAGES = window.IMAGES;

  const bgEl = document.getElementById('randomImg');
  const titleEl = document.getElementById('title');
  const metaEl1 = document.getElementById('meta1');
  const metaEl2 = document.getElementById('meta2');
  const btn = document.getElementById('changeBtn');

  if (!bgEl || !titleEl || !metaEl1 || !metaEl2|| !btn) return;

  let lastIndex = -1;
  let trytime = 15;

  // 解析文件名：作者-日期-标题.jpg
  const parseFileName = (filename) => {
    const name = filename.replace(/\.[^.]+$/, ''); // 去掉后缀
    const parts = name.split('-');

    let author = '佚名';
    let dateStr = '';
    let title = '';

    // 提取作者（永远是第一段）
    if (parts.length > 0) author = parts[0];

    // 从后往前判断：最后一节是标题 → 倒数第二节是日期
    if (parts.length >= 3) {
      title = parts.slice(2).join('-'); // 支持标题中带-的情况
      dateStr = parts[1];
    } else if (parts.length === 2) {
      const second = parts[1];
      // 判断第二段是日期还是标题（日期必须是纯数字）
      if (/^\d{4,8}$/.test(second)) {
        dateStr = second;
      } else {
        title = second;
      }
    } else if (parts.length === 1) {
      title = parts[0]; // 只有标题
    }

    // 格式化日期（支持 2009 / 200903 / 20090323）
    let dateFormatted = '';
    if (dateStr) {
      const d = dateStr.replace(/[^\d]/g, ''); // 去掉非数字
      if (d.length === 8) {
        dateFormatted = `${d.slice(0,4)}年${d.slice(4,6)}月${d.slice(6,8)}日`;
      } else if (d.length === 6) {
        dateFormatted = `${d.slice(0,4)}年${d.slice(4,6)}月`;
      } else if (d.length === 4) {
        dateFormatted = `${d}年`;
      }
    }

    return { author, date: dateFormatted, title: title || '无标题' };
  };

  const setRandomBackground = () => {
    let index;
    do {
      index = Math.floor(Math.random() * IMAGES.length);
    } while (IMAGES.length > 1 && index === lastIndex && --trytime > 0);
    

    const file = IMAGES[index];
    const url = encodeURI(IMAGE_FOLDER + file);
    const { author, date, title } = parseFileName(file);

    // 更新界面文字
    if(title){
      titleEl.textContent = title;
      titleEl.hidden= false;
    }else{
      titleEl.hidden= true;
    }
    //titleEl.textContent = title;
    
    //const metaParts = [];
    if (author){
      metaEl1.hidden = false;
      metaEl1.innerHTML = `作者：${author}`;
    }else{
      metaEl1.hidden = true;
    }

    if (date){
      metaEl2.hidden = false;
      metaEl2.innerHTML = `发布日期：${date}`;
    }else{
      metaEl2.hidden = true;
    }
    bgEl.classList.remove('loaded');
    // 加载图片
    const img = new Image();
    img.onload = () => {
      bgEl.classList.add('loaded');
      trytime = 15;
      bgEl.src= `${url}`;
      lastIndex = index;
    };
    img.onerror = () => {
      // titleEl.textContent = '小绿走丢了…';
      // metaEl1.textContent = '请检查文件名或网络';
      // metaEl2.textContent = ' ';
        setRandomBackground();
      //bgEl.style.background = '#111';
    };
    img.src = url;
    //console.log(`Loading image: ${img.src}`);
  };

  // 初始化
  setRandomBackground();

  // 按钮
  btn.addEventListener('click', () => {
    btn.textContent = '加载中…';
    btn.disabled = true;
    setRandomBackground();
    setTimeout(() => {
      btn.textContent = '再来一只绿坝娘';
      btn.disabled = false;
    }, 600);
  });

  // 空格键
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      btn.click();
    }
  });
})();