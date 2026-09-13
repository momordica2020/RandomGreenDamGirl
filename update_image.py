import json
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps


IMAGE_EXTENSIONS = {"*.jpg", "*.jpeg", "*.png", "*.gif", "*.bmp", "*.webp", "*.svg"}
THUMBNAIL_DIR = Path("images/thumbs")
THUMBNAIL_SIZE = (720, 720)
THUMBNAIL_QUALITY = 80


def create_thumbnail(source, destination):
    """返回原始图片的宽高，并确保缩略图存在。"""
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        width, height = image.size

        if destination.exists() and destination.stat().st_mtime >= source.stat().st_mtime:
            return width, height

        thumbnail = image.copy()
        thumbnail.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        if thumbnail.mode not in ("RGB", "RGBA"):
            thumbnail = thumbnail.convert("RGBA" if "transparency" in thumbnail.info else "RGB")

        destination.parent.mkdir(parents=True, exist_ok=True)
        thumbnail.save(destination, "WEBP", quality=THUMBNAIL_QUALITY, method=5)
        return width, height


def green_dam_generate_js():
    imgpath = Path("images")
    jsfile = Path("js/images.js")

    files = []
    for ext in IMAGE_EXTENSIONS:
        files.extend(imgpath.glob(ext))
    files = list({f.resolve(): f for f in files}.values())
    files.sort(key=lambda item: item.name.lower())

    dimensions = {}
    generated = 0
    total_count = len(files)
    print(f"一共{total_count}个图")

    for index, image_path in enumerate(files, 1):
        thumbnail_path = THUMBNAIL_DIR / f"{image_path.name}.webp"
        try:
            width, height = create_thumbnail(image_path, thumbnail_path)
            dimensions[image_path.name] = [width, height]
            generated += 1
        except Exception as exc:
            print(f"跳过 {image_path.name}: {exc}")

        if index % 100 == 0 or index == total_count:
            print(f"处理缩略图 {index}/{total_count}")

    jsfile.parent.mkdir(parents=True, exist_ok=True)
    image_names = [image_path.name for image_path in files if image_path.name in dimensions]
    images_json = json.dumps(image_names, ensure_ascii=False, indent=2)
    dimensions_json = json.dumps(dimensions, ensure_ascii=False, indent=2, sort_keys=True)

    current_date = datetime.now().strftime("%Y-%m-%d")
    js_content = (
        f"const IMAGES = {images_json};\n"
        "window.IMAGES = IMAGES;\n\n"
        f"window.IMAGE_DIMENSIONS = {dimensions_json};\n\n"
        "window.RECORD = {\n"
        f"  total: {generated},\n"
        f"  date: '{current_date}'\n"
        "};\n"
    )

    jsfile.write_text(js_content, encoding="utf-8")
    print(f"生成完成：{jsfile}（{generated} 张）")


if __name__ == "__main__":
    green_dam_generate_js()
