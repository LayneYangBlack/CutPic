# 🔑 SSH 密钥配置快速指南

## 一、生成 SSH 密钥对

### macOS / Linux

```bash
# 1. 生成密钥对（不要设置密码，直接回车）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# 2. 查看私钥（用于 GitHub Secrets）
cat ~/.ssh/github_deploy_key

# 3. 查看公钥（用于服务器）
cat ~/.ssh/github_deploy_key.pub
```

### Windows (PowerShell)

```powershell
# 1. 生成密钥对
ssh-keygen -t ed25519 -C "github-actions-deploy" -f $env:USERPROFILE\.ssh\github_deploy_key

# 2. 查看私钥
Get-Content $env:USERPROFILE\.ssh\github_deploy_key

# 3. 查看公钥
Get-Content $env:USERPROFILE\.ssh\github_deploy_key.pub
```

---

## 二、配置服务器

### 方式一：使用 ssh-copy-id（推荐）

```bash
# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@your-server-ip

# 测试连接
ssh -i ~/.ssh/github_deploy_key root@your-server-ip
```

### 方式二：手动配置

```bash
# 1. 复制公钥内容
cat ~/.ssh/github_deploy_key.pub

# 2. SSH 登录服务器
ssh root@your-server-ip

# 3. 添加公钥
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "粘贴公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 4. 退出并测试
exit
ssh -i ~/.ssh/github_deploy_key root@your-server-ip
```

---

## 三、配置 GitHub Secrets

### 1. 获取私钥内容

```bash
# 复制完整的私钥内容（包括开头和结尾）
cat ~/.ssh/github_deploy_key
```

输出示例：
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBqL9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
... (中间省略) ...
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END OPENSSH PRIVATE KEY-----
```

### 2. 添加到 GitHub

1. 打开仓库：https://github.com/LayneYangBlack/CutPic
2. 进入：**Settings** → **Secrets and variables** → **Actions**
3. 点击：**New repository secret**
4. 添加以下 Secrets：

#### SSH_PRIVATE_KEY
- Name: `SSH_PRIVATE_KEY`
- Value: 粘贴完整的私钥内容（包括 `-----BEGIN` 和 `-----END`）

#### REMOTE_HOST
- Name: `REMOTE_HOST`
- Value: 服务器 IP 地址（例如：`123.45.67.89`）

#### REMOTE_USER
- Name: `REMOTE_USER`
- Value: SSH 用户名（例如：`root`）

#### REMOTE_PORT
- Name: `REMOTE_PORT`
- Value: SSH 端口（例如：`22`）

#### REMOTE_TARGET
- Name: `REMOTE_TARGET`
- Value: 网站根目录（例如：`/www/wwwroot/cutpic.example.com`）

---

## 四、验证配置

### 1. 本地测试 SSH 连接

```bash
# 使用私钥测试连接
ssh -i ~/.ssh/github_deploy_key root@your-server-ip

# 如果成功登录，说明配置正确
```

### 2. 测试 GitHub Actions

```bash
# 推送代码触发部署
git checkout main
git add .
git commit -m "test: 测试自动部署"
git push origin main
```

### 3. 查看部署日志

1. 打开：https://github.com/LayneYangBlack/CutPic/actions
2. 查看最新的工作流运行记录
3. 检查每个步骤是否成功

---

## 五、常见问题

### 问题 1：Permission denied (publickey)

**原因：** 私钥或公钥配置错误

**解决：**
```bash
# 1. 检查服务器公钥
ssh root@your-server-ip
cat ~/.ssh/authorized_keys

# 2. 确认公钥是否存在
# 如果不存在，重新添加公钥

# 3. 检查权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 问题 2：Host key verification failed

**原因：** 首次连接需要确认主机指纹

**解决：**
```bash
# 手动连接一次，输入 yes 确认
ssh -i ~/.ssh/github_deploy_key root@your-server-ip
```

### 问题 3：私钥格式错误

**原因：** 复制私钥时丢失了换行符

**解决：**
- 确保复制了完整的私钥内容
- 包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`
- 保持原有的换行格式

---

## 六、安全建议

1. ✅ **私钥不要泄露**：不要提交到 Git 仓库
2. ✅ **定期更换密钥**：建议每 3-6 个月更换一次
3. ✅ **使用专用密钥**：不要使用个人 SSH 密钥
4. ✅ **限制密钥权限**：只授予必要的目录访问权限
5. ✅ **启用 SSH 密钥登录**：禁用密码登录

---

## 七、快速检查清单

部署前请确认：

- [ ] 已生成 SSH 密钥对
- [ ] 公钥已添加到服务器 `~/.ssh/authorized_keys`
- [ ] 本地可以使用私钥 SSH 登录服务器
- [ ] GitHub Secrets 已配置完整（5 个必需的 Secrets）
- [ ] 服务器目标目录存在且权限正确
- [ ] 宝塔面板 SSH 端口已开放

**配置完成后，推送代码到 main 分支即可自动部署！** 🚀
