# GitHub推送步骤

## 方法1：使用个人访问令牌（推荐）

### 第1步：创建个人访问令牌

1. 访问：https://github.com/settings/tokens
2. 点击"Generate new token" → "Generate new token (classic)"
3. 填写：
   - Note（备注）：XMT项目
   - Expiration（过期时间）：选择90天或更长
   - 勾选权限：**repo**（所有repo权限）
4. 点击底部"Generate token"
5. **复制生成的令牌**（只显示一次，请保存好）

### 第2步：推送代码

打开终端，执行以下命令：

```bash
cd /Users/sh.zqq.com/Projects/XMT

# 使用令牌推送（将YOUR_TOKEN替换为你复制的令牌）
git push https://YOUR_TOKEN@github.com/zf0497-droid/XMT1.git main
```

## 方法2：使用SSH密钥

### 第1步：生成SSH密钥

```bash
# 生成密钥
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 按3次回车（使用默认设置）

# 复制公钥
cat ~/.ssh/id_ed25519.pub
```

### 第2步：添加到GitHub

1. 访问：https://github.com/settings/keys
2. 点击"New SSH key"
3. Title：XMT项目
4. Key：粘贴刚才复制的公钥
5. 点击"Add SSH key"

### 第3步：推送代码

```bash
cd /Users/sh.zqq.com/Projects/XMT

# 更改远程地址为SSH
git remote set-url origin git@github.com:zf0497-droid/XMT1.git

# 推送
git push -u origin main
```

## 方法3：最简单（使用GitHub Desktop）

1. 下载GitHub Desktop：https://desktop.github.com/
2. 安装并登录你的GitHub账号
3. 点击"Add" → "Add Existing Repository"
4. 选择文件夹：/Users/sh.zqq.com/Projects/XMT
5. 点击"Publish repository"

---

**推荐使用方法1（个人访问令牌），最简单快速！**
