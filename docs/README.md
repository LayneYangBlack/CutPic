# 自动化部署配置文件

本目录包含自动化部署相关的配置文件和文档。

## 📁 文件说明

### 配置文件
- `.github/workflows/deploy.yml` - GitHub Actions 自动部署配置

### 文档
- `docs/DEPLOYMENT.md` - 详细的部署配置指南
- `docs/SSH_SETUP.md` - SSH 密钥配置快速指南

### 脚本
- `scripts/rollback.sh` - 手动回滚脚本

## 🚀 快速开始

### 1. 配置 SSH 密钥

参考 [SSH_SETUP.md](docs/SSH_SETUP.md) 配置 SSH 密钥。

### 2. 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

| Secret 名称 | 说明 |
|------------|------|
| `SSH_PRIVATE_KEY` | SSH 私钥内容 |
| `REMOTE_HOST` | 服务器 IP 地址 |
| `REMOTE_USER` | SSH 用户名 |
| `REMOTE_PORT` | SSH 端口 |
| `REMOTE_TARGET` | 网站根目录 |

### 3. 推送代码触发部署

```bash
git checkout main
git add .
git commit -m "feat: 新功能"
git push origin main
```

## 📖 详细文档

完整的配置步骤和常见问题解决方案，请查看：
- [部署配置指南](docs/DEPLOYMENT.md)
- [SSH 配置指南](docs/SSH_SETUP.md)

## 🔄 回滚操作

如果部署出现问题，可以使用回滚脚本：

```bash
# 1. 修改脚本中的服务器配置
vim scripts/rollback.sh

# 2. 执行回滚
./scripts/rollback.sh
```

## ⚠️ 注意事项

1. 首次部署前，请先手动触发测试
2. 确保服务器目录权限正确
3. 定期检查备份文件，避免占用过多磁盘空间
4. 生产环境部署前建议先在测试环境验证

## 🔒 安全建议

- 不要在代码中硬编码敏感信息
- 定期更换 SSH 密钥
- 使用专用部署用户，不要直接使用 root
- 限制 SSH 登录 IP 白名单
