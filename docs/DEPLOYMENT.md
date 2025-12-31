# 🚀 自动化部署配置指南

## 📋 目录
- [概述](#概述)
- [前置准备](#前置准备)
- [配置步骤](#配置步骤)
- [测试部署](#测试部署)
- [常见问题](#常见问题)
- [回滚方案](#回滚方案)

---

## 概述

本项目使用 **GitHub Actions** 实现自动化部署，当代码推送到 `main` 分支时，会自动触发以下流程：

1. ✅ 检出代码
2. ✅ 安装依赖
3. ✅ 构建项目（`npm run build`）
4. ✅ 备份当前版本
5. ✅ 通过 SSH 部署到宝塔服务器
6. ✅ 部署完成通知

---

## 前置准备

### 1. 服务器信息

请准备以下信息：

- **服务器 IP 地址**：例如 `123.45.67.89`
- **SSH 端口**：默认 `22`，宝塔可能是 `22` 或其他端口
- **SSH 用户名**：通常是 `root` 或 `www`
- **网站根目录**：例如 `/www/wwwroot/your-domain.com`

### 2. 宝塔面板配置

#### 2.1 检查 SSH 是否开启

1. 登录宝塔面板
2. 进入 **安全** 菜单
3. 确认 SSH 端口已开放（默认 22）
4. 如果修改过端口，记录新端口号

#### 2.2 创建部署用户（推荐，更安全）

**方式一：使用 root 用户（简单但不够安全）**
- 直接使用 root 用户和密钥

**方式二：创建专用部署用户（推荐）**

```bash
# SSH 登录服务器后执行

# 1. 创建部署用户
useradd -m -s /bin/bash deploy

# 2. 设置网站目录权限
chown -R deploy:deploy /www/wwwroot/your-domain.com

# 3. 允许 deploy 用户重启 Nginx（可选）
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx" >> /etc/sudoers
```

---

## 配置步骤

### 步骤 1：生成 SSH 密钥对

在**本地电脑**执行以下命令：

```bash
# 生成 SSH 密钥对（不要设置密码，直接回车）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# 会生成两个文件：
# - ~/.ssh/github_deploy_key       (私钥，用于 GitHub Secrets)
# - ~/.ssh/github_deploy_key.pub   (公钥，用于服务器)
```

### 步骤 2：配置服务器公钥

将公钥添加到服务器的 `authorized_keys`：

```bash
# 方式一：使用 ssh-copy-id（推荐）
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@your-server-ip

# 方式二：手动复制
# 1. 查看公钥内容
cat ~/.ssh/github_deploy_key.pub

# 2. SSH 登录服务器
ssh root@your-server-ip

# 3. 添加公钥到 authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 步骤 3：测试 SSH 连接

```bash
# 使用私钥测试连接
ssh -i ~/.ssh/github_deploy_key root@your-server-ip

# 如果能成功登录，说明配置正确
```

### 步骤 4：配置 GitHub Secrets

1. 打开 GitHub 仓库页面
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，依次添加以下密钥：

#### 必需的 Secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | 执行 `cat ~/.ssh/github_deploy_key` 复制全部内容 |
| `REMOTE_HOST` | 服务器 IP 地址 | `123.45.67.89` |
| `REMOTE_USER` | SSH 用户名 | `root` 或 `deploy` |
| `REMOTE_PORT` | SSH 端口 | `22`（默认）或其他端口 |
| `REMOTE_TARGET` | 网站根目录 | `/www/wwwroot/your-domain.com` |

#### 配置示例：

**SSH_PRIVATE_KEY**（私钥内容）：
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
... (完整的私钥内容) ...
-----END OPENSSH PRIVATE KEY-----
```

**REMOTE_HOST**：
```
123.45.67.89
```

**REMOTE_USER**：
```
root
```

**REMOTE_PORT**：
```
22
```

**REMOTE_TARGET**：
```
/www/wwwroot/cutpic.example.com
```

### 步骤 5：配置宝塔网站目录

1. 登录宝塔面板
2. 进入 **网站** 菜单
3. 找到你的网站，点击 **设置**
4. 确认 **网站目录** 路径（这个路径就是 `REMOTE_TARGET`）
5. 确保目录权限正确：

```bash
# SSH 登录服务器后执行
chown -R www:www /www/wwwroot/your-domain.com
chmod -R 755 /www/wwwroot/your-domain.com
```

---

## 测试部署

### 方式一：推送代码触发（自动）

```bash
# 在本地项目目录执行
git checkout main
git add .
git commit -m "test: 测试自动部署"
git push origin main
```

### 方式二：手动触发（推荐首次测试）

1. 打开 GitHub 仓库页面
2. 进入 **Actions** 标签
3. 选择 **自动部署到宝塔服务器** 工作流
4. 点击 **Run workflow** → **Run workflow**
5. 查看部署日志

### 查看部署日志

1. 进入 **Actions** 标签
2. 点击最新的工作流运行记录
3. 查看每个步骤的执行日志
4. 如果失败，查看错误信息

---

## 常见问题

### 1. SSH 连接失败

**错误信息：**
```
Permission denied (publickey)
```

**解决方案：**
- 检查 `SSH_PRIVATE_KEY` 是否完整复制（包括开头和结尾）
- 检查服务器 `~/.ssh/authorized_keys` 是否包含对应的公钥
- 检查服务器 SSH 配置：`/etc/ssh/sshd_config` 中 `PubkeyAuthentication` 是否为 `yes`
- 重启 SSH 服务：`systemctl restart sshd`

### 2. 权限不足

**错误信息：**
```
Permission denied
```

**解决方案：**
```bash
# 修改目标目录权限
chown -R deploy:deploy /www/wwwroot/your-domain.com
chmod -R 755 /www/wwwroot/your-domain.com
```

### 3. 端口连接失败

**错误信息：**
```
Connection refused
```

**解决方案：**
- 检查 `REMOTE_PORT` 是否正确
- 检查服务器防火墙是否开放 SSH 端口
- 宝塔面板 → 安全 → 检查端口是否放行

### 4. 目录不存在

**错误信息：**
```
No such file or directory
```

**解决方案：**
```bash
# 创建目标目录
mkdir -p /www/wwwroot/your-domain.com
chown -R www:www /www/wwwroot/your-domain.com
```

### 5. 构建失败

**错误信息：**
```
npm ERR! code ELIFECYCLE
```

**解决方案：**
- 检查 `package.json` 中的构建命令是否正确
- 本地测试 `npm run build` 是否成功
- 检查依赖是否完整

---

## 回滚方案

### 自动备份机制

部署脚本会自动备份当前版本，备份目录格式：
```
/www/wwwroot/your-domain.com_backup_20250131_143025
```

### 手动回滚步骤

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 查看备份列表
ls -lt /www/wwwroot/ | grep backup

# 3. 回滚到指定版本
cd /www/wwwroot
rm -rf your-domain.com
cp -r your-domain.com_backup_20250131_143025 your-domain.com

# 4. 重启 Nginx（可选）
systemctl reload nginx
```

### 通过 GitHub Actions 回滚

1. 进入 **Actions** 标签
2. 找到之前成功的部署记录
3. 点击 **Re-run all jobs**
4. 等待重新部署完成

---

## 高级配置（可选）

### 1. 添加部署通知

可以集成钉钉、企业微信、Slack 等通知：

```yaml
# 在 .github/workflows/deploy.yml 中添加
- name: 钉钉通知
  if: always()
  run: |
    curl 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN' \
      -H 'Content-Type: application/json' \
      -d '{
        "msgtype": "text",
        "text": {
          "content": "部署状态: ${{ job.status }}\n分支: ${{ github.ref_name }}"
        }
      }'
```

### 2. 多环境部署

可以配置不同分支部署到不同环境：

```yaml
on:
  push:
    branches:
      - main      # 生产环境
      - develop   # 测试环境
```

### 3. 部署前运行测试

```yaml
- name: 运行测试
  run: npm test
```

---

## 安全建议

1. ✅ **使用专用部署用户**，不要直接使用 root
2. ✅ **定期更换 SSH 密钥**（建议每 3-6 个月）
3. ✅ **限制 SSH 登录 IP**（宝塔面板 → 安全 → SSH 安全）
4. ✅ **启用 SSH 密钥登录**，禁用密码登录
5. ✅ **定期检查部署日志**，发现异常及时处理
6. ✅ **不要在代码中硬编码敏感信息**

---

## 联系支持

如果遇到问题，请检查：
1. GitHub Actions 日志
2. 服务器 SSH 日志：`/var/log/auth.log`
3. Nginx 日志：`/www/wwwroot/your-domain.com/log/`

---

**配置完成后，每次推送到 main 分支都会自动部署！** 🎉
