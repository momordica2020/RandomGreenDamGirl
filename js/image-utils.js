// js/image-utils.js —— 共享的图片数据逻辑（首页随机 + 图库页共用）
(() => {
  const IMAGE_FOLDER = 'images/';
  const IMAGES = window.IMAGES || [];

  // 解析文件名：作者-日期-标题.后缀
  const parseFileName = (filename) => {
    const name = filename.replace(/\.[^.]+$/, ''); // 去掉后缀
    const parts = name.split('-');

    let author = '';
    let dateStr = '';
    let title = '';

    // 提取作者（永远是第一段）
    if (parts.length > 0) author = parts[0];
    const second = parts[1];
    if (/^\d{4,8}$/.test(second)) {
      dateStr = second;
      title = parts.slice(2).join('-'); // 支持标题中带-的情况
    } else {
      title = parts.slice(1).join('-'); // 支持标题中带-的情况
    }

    // 格式化日期（支持 2009 / 200903 / 20090323）
    let dateFormatted = '';
    let year = 0;
    if (dateStr) {
      const d = dateStr.replace(/[^\d]/g, ''); // 去掉非数字
      if (d.length === 8) {
        dateFormatted = `${d.slice(0, 4)}年${d.slice(4, 6)}月${d.slice(6, 8)}日`;
        year = Number(d.slice(0, 4));
      } else if (d.length === 6) {
        dateFormatted = `${d.slice(0, 4)}年${d.slice(4, 6)}月`;
        year = Number(d.slice(0, 4));
      } else if (d.length === 4) {
        dateFormatted = `${d}年`;
        year = Number(d);
      }
    }

    return { author, date: dateFormatted, year, title: title || '', file: filename };
  };

  // 一次性构建全部图片的结构化数据
  const IMAGE_DATA = IMAGES.map(parseFileName);

  // 生成安全的图片地址。encodeURI 不会编码 # ? & 等保留字符，
  // 文件名里含 # 时会被浏览器当成 URL 片段导致加载失败，故用 encodeURIComponent。
  const imageUrl = (file) => IMAGE_FOLDER + encodeURIComponent(file);

  window.ImageData = {
    IMAGE_FOLDER,
    IMAGES,
    IMAGE_DATA,
    parseFileName,
    imageUrl,
  };
})();