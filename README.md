# 2026 TI电赛备赛监督面板 🚀

专为电赛控制题备赛团队设计的高颜值、极简风网页端进度管理工具。基于原生 HTML/JS + Tailwind CSS 构建，纯静态，数据存储于本地，高度注重隐私并支持一键导入/导出。

## 🌟 核心特性
- **Apple UI 风格**：高斯模糊导航、精致圆角阴影、流畅页面动画。
- **GitHub 热力图**：精准计算 4月16日-7月15日 赛程倒计时的贡献热力。
- **数据可视化**：集成 Chart.js，实时分析学习趋势和技能分布。
- **离线与安全**：基于 `localStorage`，无后端即可使用，支持 JSON 数据全量导出/导入。
- **干货内置**：自带《从小白到国赛》的控制题硬核备考路线。

## 🚀 如何部署到 GitHub Pages (免费且只需3分钟)

因为本项目为纯静态结构，无需 Node.js 或数据库，直接部署即可使用。

1. **创建仓库**
   - 登录你的 [GitHub](https://github.com/) 账号。
   - 点击右上角 `+` 选择 **New repository**。
   - 命名为 `ti2026-dashboard`，设为 Public，点击 Create。

2. **上传文件**
   - 将本项目生成的这 4 个文件（包含目录结构）：
     - `index.html`
     - `css/styles.css`
     - `js/data.js`
     - `js/heatmap.js`
     - `js/app.js`
   - 手动拖拽上传到刚才创建的 GitHub 仓库中，并点击 **Commit changes**。

3. **开启 GitHub Pages**
   - 在该仓库的顶部导航栏点击 **Settings** (设置)。
   - 在左侧侧边栏找到并点击 **Pages**。
   - 在 **Build and deployment** 下的 **Source** 选项，选择 `Deploy from a branch`。
   - 在 **Branch** 下方的下拉菜单中，选择 `main` (或 `master`) 分支，文件夹保持 `/ (root)`，点击 **Save**。
   
4. **大功告成**
   - 等待约 1-2 分钟，刷新 Pages 设置页面，顶部会显示类似：`Your site is live at https://你的用户名.github.io/ti2026-dashboard/` 的链接。
   - 把链接发给你的队友，开始备赛打卡吧！