# 用户操作手册版本记录

| 版本 | 定稿日期 | 文件名 | 说明 |
|------|----------|--------|------|
| v0.1 | 2026-05-26 | `华夏银行投融资碳核算-用户操作手册-20260526-v0.1.docx` | 初稿：三角色操作说明、业务流程文字描述、全流程截图 |

## 生成方式

```bash
cd prototype && python3 -m http.server 8765
# 另开终端
cd .. && npm run manual:build
```

仅更新 Word（不重新截图）：

```bash
python3 scripts/generate-manual-docx.py
```
