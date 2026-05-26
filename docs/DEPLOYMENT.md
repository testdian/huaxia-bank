# 部署说明（UAT / 生产）

仓库：[testdian/huaxia-bank](https://github.com/testdian/huaxia-bank)

| 环境 | 分支 | 公网地址 |
|------|------|----------|
| **UAT** | `uat` | https://testdian.github.io/huaxia-bank/uat/app.html |
| **生产** | `main` | https://testdian.github.io/huaxia-bank/app.html |

## 流程

1. 开发完成后 `git push origin uat` → 自动部署 UAT  
2. 验收通过后 GitHub 创建 PR：`uat` → `main`，合并后部署生产  

## GitHub 配置

- **Settings → Pages**：Branch `gh-pages`，目录 `/ (root)`  
- **Settings → Environments**：新建 `uat`、`production`  
