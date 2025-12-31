#!/bin/bash

# 手动回滚脚本
# 用于快速回滚到之前的版本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置（需要根据实际情况修改）
REMOTE_USER="root"                                    # SSH 用户名
REMOTE_HOST="your-server-ip"                          # 服务器 IP
REMOTE_PORT="22"                                      # SSH 端口
REMOTE_TARGET="/www/wwwroot/your-domain.com"          # 网站根目录
SSH_KEY="$HOME/.ssh/github_deploy_key"                # SSH 私钥路径

echo -e "${GREEN}=== 开始回滚操作 ===${NC}"

# 检查 SSH 密钥是否存在
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}错误: SSH 私钥不存在: $SSH_KEY${NC}"
    exit 1
fi

# 连接服务器并列出备份
echo -e "${YELLOW}正在获取备份列表...${NC}"
BACKUPS=$(ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
    "ls -dt $(dirname $REMOTE_TARGET)/$(basename $REMOTE_TARGET)_backup_* 2>/dev/null || echo ''")

if [ -z "$BACKUPS" ]; then
    echo -e "${RED}错误: 没有找到备份文件${NC}"
    exit 1
fi

# 显示备份列表
echo -e "${GREEN}可用的备份版本：${NC}"
echo "$BACKUPS" | nl
echo ""

# 选择备份版本
read -p "请输入要回滚的版本编号（输入 0 取消）: " choice

if [ "$choice" = "0" ]; then
    echo -e "${YELLOW}已取消回滚操作${NC}"
    exit 0
fi

# 获取选择的备份路径
SELECTED_BACKUP=$(echo "$BACKUPS" | sed -n "${choice}p")

if [ -z "$SELECTED_BACKUP" ]; then
    echo -e "${RED}错误: 无效的选择${NC}"
    exit 1
fi

echo -e "${YELLOW}选择的备份: $SELECTED_BACKUP${NC}"
read -p "确认回滚？(y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}已取消回滚操作${NC}"
    exit 0
fi

# 执行回滚
echo -e "${GREEN}正在回滚...${NC}"
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
    set -e

    # 备份当前版本（以防回滚失败）
    if [ -d "$REMOTE_TARGET" ]; then
        EMERGENCY_BACKUP="${REMOTE_TARGET}_emergency_backup_\$(date +%Y%m%d_%H%M%S)"
        echo "创建紧急备份: \$EMERGENCY_BACKUP"
        cp -r "$REMOTE_TARGET" "\$EMERGENCY_BACKUP"
    fi

    # 删除当前版本
    echo "删除当前版本..."
    rm -rf "$REMOTE_TARGET"

    # 恢复备份版本
    echo "恢复备份版本..."
    cp -r "$SELECTED_BACKUP" "$REMOTE_TARGET"

    # 重启 Nginx（可选）
    # systemctl reload nginx

    echo "回滚完成！"
EOF

echo -e "${GREEN}=== 回滚成功！===${NC}"
echo -e "${YELLOW}提示: 如果回滚后有问题，可以使用紧急备份恢复${NC}"
