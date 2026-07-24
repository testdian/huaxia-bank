# 部署说明（UAT / 生产）

| 环境 | 分支 | 公网地址 |
|------|------|----------|
| **UAT** | `uat` | https://testdian.github.io/investment-carbon-demo/uat/ （或 `/uat/index.html`） |
| **生产** | `main` | https://testdian.github.io/investment-carbon-demo/ （或 `/app.html` 会跳转至同目录首页） |

## 三种「环境」分别是什么？

| 名称 | 来源 | 要不要管 |
|------|------|----------|
| **uat** | 你在 Environments 里建的 | 要。UAT 部署 job 挂在这里 |
| **production** | 你在 Environments 里建的 | 要。生产部署 / 审批挂在这里 |
| **github-pages** | 开启 Pages 且来源选 **GitHub Actions** 时自动生成 | **可忽略或删除**。与我们的 peaceiris 部署无关 |

## UAT 404 时必查

### 1. Pages 来源（最常见配置问题）

打开 **Settings → Pages → Build and deployment**：

1. **Source** 必须选：**Deploy from a branch**（不要选 GitHub Actions）
2. **Branch**：`gh-pages`，目录 **`/ (root)`**
3. 保存后等 2～5 分钟再打开 UAT 链接

### 2. 链接是否带项目子路径

本仓库为 **Project Pages**，根路径是 `/investment-carbon-demo/`，UAT 在 `/investment-carbon-demo/uat/`。

- 正确：https://testdian.github.io/investment-carbon-demo/uat/
- 错误：https://testdian.github.io/uat/（会 404）

### 3. 旧版 app.html 跳转问题

若打开 `/uat/app.html` 后跳到 `testdian.github.io/` 并 404，说明 `app.html` 使用了错误的绝对路径 `/`。请更新至最新 `uat` 分支（已改为相对目录跳转），或直接使用 `/uat/` 入口。

## 日常流程

1. 开发完成 → `git push origin uat` → 自动部署到 `/uat/`
2. 验收通过 → GitHub **PR：`uat` → `main`** → 合并
3. 上生产（二选一）：
   - **Actions** → **Deploy GitHub Pages** → **Run workflow** → 选 `production`（从 `main` 检出并发布到根目录）
   - 或在 `deploy.yml` 里取消 `main` 分支注释，合并后 push `main` 自动发生产

## Actions 里两个 Workflow

| 名称 | 说明 |
|------|------|
| **Deploy GitHub Pages** | 我们配置的，发布到 `gh-pages` 的 `/` 或 `/uat/` |
| **pages-build-deployment** | GitHub 自带；Pages 来源为 GitHub Actions 时才有用。改成分支部署后可忽略 |

## 首次 checklist

- [ ] Pages 来源：`gh-pages` 分支（见上文）
- [ ] Environments：已建 `uat`、`production`
- [ ] （可选）`production` 开启 Required reviewers
