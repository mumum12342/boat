"""从 21 份 DOCX 访谈稿生成网站内置档案数据。"""

import json
import re
from datetime import datetime
from pathlib import Path

from docx import Document

SOURCE_DIR = Path(r"D:\大创项目资料\挑战杯大挑\访谈稿_21份\访谈稿_21份")
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "interviews-data.js"

TITLES = {
    "A-01": "家属眼中的龙船传承记忆",
    "A-02": "年轻队员的龙船成长路",
    "A-03": "民俗爱好者眼中的叠滘龙船",
    "A-04": "老一辈扒手的竞渡记忆",
    "A-05": "龙船队员家属的守候与支持",
    "A-06": "文创经营者与龙船文化传播",
    "A-07": "本地青年学生的龙船文化观察",
    "A-08": "街道青年工作中的龙船文化传承",
    "A-09": "少年队员的龙船训练体验",
    "A-10": "龙船基地工作人员的日常守护",
    "A-11": "训练基地管理者的组织经验",
    "A-12": "龙船教练谈训练与传承",
    "A-13": "舵手眼中的弯道与默契",
    "A-14": "成年队员的训练与竞渡经历",
    "A-15": "女子龙船队员的参与体验",
    "A-16": "社区工作者谈龙船文化建设",
    "A-17": "外地游客眼中的叠滘龙船",
    "A-18": "鼓手讲述节奏、协作与坚守",
    "A-19": "民俗导赏员的文化传播实践",
    "A-20": "退休教师记忆中的乡土龙船",
    "A-21": "餐饮经营者眼中的龙船经济",
}

ROLE_BY_ID = {
    "A-01": "家属外部视角",
    "A-02": "队员划手",
    "A-03": "本地居民",
    "A-04": "队员划手",
    "A-05": "家属外部视角",
    "A-06": "从业者商户",
    "A-07": "本地居民",
    "A-08": "管理与组织",
    "A-09": "队员划手",
    "A-10": "管理与组织",
    "A-11": "管理与组织",
    "A-12": "教练舵手鼓手",
    "A-13": "教练舵手鼓手",
    "A-14": "队员划手",
    "A-15": "队员划手",
    "A-16": "管理与组织",
    "A-17": "家属外部视角",
    "A-18": "教练舵手鼓手",
    "A-19": "从业者商户",
    "A-20": "本地居民",
    "A-21": "从业者商户",
}

FIELD_PATTERNS = {
    "category": re.compile(r"^(?:受访者)?身份类别[：:]\s*(.+)$"),
    "collectDate": re.compile(r"^访谈日期[：:]\s*(.+)$"),
    "location": re.compile(r"^访谈地点[：:]\s*(.+)$"),
}


def get_lines(path):
    lines = []
    for paragraph in Document(path).paragraphs:
        lines.extend(part.strip() for part in paragraph.text.splitlines() if part.strip())
    return lines


def normalize_date(value, fallback):
    match = re.search(r"(20\d{2})\D+(\d{1,2})\D+(\d{1,2})", value)
    if not match:
        return fallback
    year, month, day = (int(part) for part in match.groups())
    return f"{year:04d}-{month:02d}-{day:02d}"


def field_value(lines, field):
    pattern = FIELD_PATTERNS[field]
    for line in lines:
        match = pattern.match(line)
        if match:
            return match.group(1).strip()
    return ""


def content_start(lines):
    markers = ("【访谈核心摘要】", "【访谈实录】")
    indexes = [index for index, line in enumerate(lines) if any(marker in line for marker in markers)]
    if indexes:
        return min(indexes)

    for index, line in enumerate(lines):
        if re.match(r"^(?:访谈者|采访者|问|Q)[：:]", line, re.IGNORECASE):
            return index
    raise ValueError("找不到访谈正文起点")


def parse_archive(path):
    id_match = re.search(r"A-\d{2}", path.name)
    if not id_match:
        raise ValueError(f"文件名缺少访谈编号：{path.name}")

    archive_id = id_match.group(0)
    lines = get_lines(path)
    category = field_value(lines, "category")
    location = field_value(lines, "location")
    date_from_name = re.search(r"(20\d{2})-(\d{2})-(\d{2})", path.name)
    fallback_date = "-".join(date_from_name.groups()) if date_from_name else ""
    collect_date = normalize_date(field_value(lines, "collectDate"), fallback_date)
    start = content_start(lines)
    content = "\n".join(lines[start:]).strip()

    if not category or not collect_date or not location or not content:
        missing = [
            name
            for name, value in {
                "身份类别": category,
                "访谈日期": collect_date,
                "访谈地点": location,
                "正文": content,
            }.items()
            if not value
        ]
        raise ValueError(f"{archive_id} 缺少字段：{', '.join(missing)}")

    return {
        "id": archive_id,
        "title": TITLES[archive_id],
        "category": category,
        "role": ROLE_BY_ID[archive_id],
        "inheritor": category,
        "collectDate": collect_date,
        "location": location,
        "content": content,
        "images": [],
        "createdAt": f"{collect_date}T00:00:00",
    }


def main():
    files = sorted(
        (path for path in SOURCE_DIR.glob("*.docx") if not path.name.startswith("~$")),
        key=lambda path: re.search(r"A-(\d{2})", path.name).group(1),
    )
    archives = [parse_archive(path) for path in files]
    expected_ids = [f"A-{number:02d}" for number in range(1, 22)]
    actual_ids = [archive["id"] for archive in archives]
    if actual_ids != expected_ids:
        raise ValueError(f"访谈编号不完整：{actual_ids}")

    payload = json.dumps(archives, ensure_ascii=False, indent=4)
    OUTPUT_FILE.write_text(
        "// 此文件由 tools/import_interviews.py 从 21 份访谈稿生成，请勿手动修改。\n"
        f"const archiveData = {payload};\n",
        encoding="utf-8",
    )
    print(f"已生成 {len(archives)} 条档案：{OUTPUT_FILE}")
    print(f"正文总字符数：{sum(len(item['content']) for item in archives)}")


if __name__ == "__main__":
    main()
