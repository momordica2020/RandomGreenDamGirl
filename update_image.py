
import os
from datetime import datetime
from pathlib import Path

def green_dam_generate_js():
    imgpath = r"images"
    jsfile  = r"js/images.js"

    os.makedirs(os.path.dirname(jsfile), exist_ok=True)

    # 只取常见图片后缀
    extensions = {"*.jpg", "*.jpeg", "*.png", "*.gif", "*.bmp", "*.webp", "*.svg"}
    files = []
    for ext in extensions:
        files.extend(Path(imgpath).glob(ext))

    # 去重（不同大小写也算同一个）
    files = list({f.resolve(): f for f in files}.values())
    files.sort(key=lambda x: x.name.lower())  # 可选：按文件名排序
    total_count = len(files)
    print(f"一共{total_count}个图")

    # 构建 JS 内容
    sb = ["const IMAGES = [\n"]
    for f in files:
        sb.append(f"  '{f.name}',\n")
    sb.append("];\nwindow.IMAGES = IMAGES;\n\n")

    current_date = datetime.now().strftime("%Y-%m-%d")

    sb.append("window.RECORD = {\n")
    sb.append(f"  total: {total_count},\n")
    sb.append(f"  date: '{current_date}'\n")
    sb.append("};\n")
    # -------------------------------------

    Path(jsfile).write_text("".join(sb), encoding="utf-8")
    print(f"生成完成：{jsfile}")

if __name__ == "__main__":
    green_dam_generate_js()