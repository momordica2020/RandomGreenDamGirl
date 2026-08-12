(() => {
  const { IMAGE_FOLDER, IMAGES, parseFileName, imageUrl } = window.ImageData;
  const RECORD = window.RECORD;

  const bgEl = document.getElementById('randomImg');
  const titleEl = document.getElementById('title');
  const metaEl1 = document.getElementById('meta1');
  const metaEl2 = document.getElementById('meta2');
  const btn = document.getElementById('changeBtn');
  const record = document.getElementById('record');

  if (!bgEl || !titleEl || !metaEl1 || !metaEl2|| !btn) return;

  let lastIndex = -1;
  let trytime = 15;

  const setRandomBackground = () => {
    
    let index;
    do {
      index = Math.floor(Math.random() * IMAGES.length);
    } while (IMAGES.length > 1 && index === lastIndex && --trytime > 0);
    

    const file = IMAGES[index];
    const url = imageUrl(file);
    const { author, date, title } = parseFileName(file);

    // 更新界面文字
    if(title){
      titleEl.textContent = title;
      titleEl.hidden= false;
    }else{
      titleEl.hidden= true;
    }
	if(record)
	{
		record.textContent = `${RECORD.total}张图片，更新日期：${RECORD.date}`
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
    
    // 加载图片
    bgEl.classList.remove('loaded');
    const img = new Image();
    img.onload = () => {
      setTimeout(() => {
        bgEl.src = url;
        bgEl.classList.add('loaded');
        trytime = 15;
        lastIndex = index;
      }, 200);


    };
    img.onerror = () => {
        setRandomBackground();
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