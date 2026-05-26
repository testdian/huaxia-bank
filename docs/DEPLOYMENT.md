# 部署说明（UAT / 生产）

| 环境 | 分支 | 公网地址 |
|------|------|----------|
| **UAT** | `uat` | https://testdian.github.io/huaxia-bank/uat/app.html |
| **生产** | `main` | https://testdian.github.io/huaxia-bank/app.html |

## 三种「环境」分别是什么？

| 名称 | 来源 | 要不要管 |
|------|------|----------|
| **uat** | 你在 Environments 里建的 | 要。UAT 部署 job 挂在这里 |
| **production** | 你在 Environments 里建的 | 要。生产部署 / 审批挂在这里 |
| **github-pages** | 开启 Pages 且来源选 **GitHub Actions** 时自动生成 | **可忽略或删除**。与我们的 peaceiris 部署无关 |

## UAT 404 时必查（最重要）

打开 **Settings → Pages → Build and deployment**：

1. **Source** 必须选：**Deploy from a branch**（不要选 GitHub Actions）
2. **Branch**：`gh-pages`，目录 **`/ (root)`**
3. 保存后等 2～5 分钟再打开 UAT 链接

原因：当前若选的是 **GitHub Actions**，只会发布 `pages-build-deployment` 打出来的包（通常只有生产根目录），**不会**读 `gh-pages` 分支里我们推的 `uat/` 目录，所以 UAT 会 404。

`gh-pages` 分支上已有 `uat/app.html` 时，只要 Pages 来源改对，UAT 即可访问。

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
