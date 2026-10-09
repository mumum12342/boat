# 叠滘龙船文化口述史档案库

> 记录叠滘扒龙船的传承记忆，守护非遗文化瑰宝

## 项目简介

本项目是一个基于浏览器的口述史档案管理系统，旨在收集、整理和展示叠滘龙船文化的口述历史记录。通过数字化的方式，让珍贵的非遗文化得以永久保存并传承后代。

## 技术栈

- **前端框架**：HTML5 + TailwindCSS
- **脚本语言**：原生 JavaScript
- **数据存储**：浏览器 LocalStorage
- **无需后端**：纯前端实现，开箱即用

## 功能特点

- 多页面架构：首页、搜索页、详情页、后台管理
- 本地数据持久化，关闭浏览器数据不丢失
- 关键词搜索，支持标题和传承人姓名模糊检索
- 响应式设计，完美适配电脑和手机端
- 国风非遗风格界面，中国红+鎏金配色
- 预置3条示范口述史数据

## 快速开始

### 直接打开

直接双击 `index.html` 文件在浏览器中打开即可使用。

### 本地服务器（推荐）

```bash
# 使用 Python 启动
cd diecicao-dragonboat
python -m http.server 8080

# 使用 Node.js 启动
npx serve .
```

然后访问 http://localhost:8080

## 项目结构

```
diejiao-dragonboat/
├── index.html      # 首页
├── search.html     # 搜索页
├── detail.html     # 详情页
├── admin.html      # 后台管理页
├── data.js         # 数据处理模块
├── README.md       # 项目说明文件
└── LICENSE         # 开源许可证
```

## 使用说明

### 首页
浏览项目简介和叠滘龙船文化概述

### 档案搜索
- 在搜索框输入关键词
- 支持按标题或传承人姓名搜索
- 点击卡片查看详情

### 详情页
查看单条口述史完整内容

### 后台管理
- 添加新的口述史档案
- 编辑已有档案
- 删除不需要的档案

## 数据说明

所有数据存储在浏览器 LocalStorage 中，键名为 `diejiao_dragon_boat_archives`。数据结构如下：

```javascript
{
  id: "唯一标识符",
  title: "口述史标题",
  inheritor: "传承人姓名",
  collectDate: "采集日期",
  content: "正文内容",
  images: ["图片URL数组"],
  createdAt: "创建时间"
}
```

## 二次开发

- 修改文案：直接在对应的 HTML 文件中修改中文内容
- 替换图片：更换 `images` 数组中的图片 URL
- 扩充功能：在 `data.js` 中添加新的数据处理函数

## 项目归属

- 项目名称：叠滘龙船文化口述史档案库
- 采集整理：叠滘龙船文化研究组
- 联系邮箱：contact@diejiao-dragonboat.example.com

## 开源许可

本项目采用 MIT 开源许可证，详见 [LICENSE](LICENSE) 文件。

---

*记录龙船故事，传承非遗文化*
