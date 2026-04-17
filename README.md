# 2026 TI电赛备赛控制中心 🚀 (V2 升级版)

专为电赛控制题备赛团队设计的高颜值、极简风网页端进度管理工具。**基于顶级开源项目 [Study-Tracker](https://github.com/prokunal/Study-Tracker) 和 [Table Habit (mhabit)](https://github.com/friesi23/mhabit) 的核心理念进行深度 UI/UX 重构与功能升级。**

## ✨ V2 核心升级特性
- **极致 Apple UI/UX**：引入全局玻璃态 (Glassmorphism)、新拟态 (Neumorphism) 暗示、柔和阴影与丝滑的弹窗动画。
- **二维模块进度矩阵 (Progress Table)**：新增核心功能！将日期与学习模块（如PID、STM32外设）交叉形成网格，通过颜色深度直观展示薄弱环节，支持点击空白处快速补打卡。
- **高级弹窗打卡 (Modal Check-in)**：废弃生硬的页面表单，采用悬浮 Modal，支持主题多选、自定义模块、Markdown 笔记和专注时长滑块调节。
- **Subject Analytics (主题分析)**：增强图表模块，精确统计各个硬核技能（电机驱动、传感器融合等）的时间投入比。
- **升级版贡献热力图**：更舒展、更清晰的 GitHub 风格赛程热力图，带有高级 Hover Tooltips。
- **纯前端与数据安全**：依然保持纯静态 HTML/JS 结构，零配置可直接部署到 GitHub Pages，数据使用 `localStorage` 并支持 JSON 导入导出。

## 🚀 如何部署到 GitHub Pages (3分钟搞定)

由于项目完全由前端代码构成，无需 Node.js 或数据库，直接上传即可上线。

1. **创建 / 更新仓库**
   - 登录 [GitHub](https://github.com/)。
   - 创建新仓库（如 `ti2026-dashboard-v2`），或打开你已有的仓库。

2. **上传文件**
   - 将本项目的所有文件（包含子目录 `css/` 和 `js/`）：
     - `index.html`
     - `css/styles.css`
     - `js/data.js`
     - `js/heatmap.js`
     - `js/app.js`
   - 手动拖拽上传到仓库根目录，点击 **Commit changes**。

3. **开启 GitHub Pages 服务**
   - 在该仓库顶部点击 **Settings**。
   - 左侧边栏点击 **Pages**。
   - **Source** 选择 `Deploy from a branch`。
   - **Branch** 选择 `main` (或 `master`)，文件夹保持 `/ (root)`，点击 **Save**。
   
4. **访问你的专属控制面板**
   - 等待约 1-2 分钟，页面顶部会显示绿色的部署成功提示及链接。
   - 点击链接，尽情享受丝滑的打卡体验吧！

---
*DESIGNED IN CALIFORNIA STYLE · BUILD FOR EXCELLENCE*