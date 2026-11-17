# 一起去哪儿｜中国旅行共创地图

这是一个温柔奶油风的多人旅行地图网页 MVP。包含地图选点、城市档案、景点清单、交通/住宿/其他预算、城市状态、投票、留言和实时同步。

## 先本地预览
直接用浏览器打开 `index.html`。未配置数据库时，页面可进行本地演示；数据只保存在当前页面运行期间，不会自动同步给朋友。

## 开启多人实时协作（免费额度方案）
需要一个 Supabase 项目和一个静态网页托管服务（例如 Vercel）。

### 1. 创建 Supabase 数据库
1. 注册/登录 https://supabase.com/ ，创建一个新项目。
2. 打开项目的 SQL Editor。
3. 把压缩包里的 `supabase_setup.sql` 全部复制进去并运行。
4. 在 Project Settings → API 中复制 Project URL 和 anon public key。

### 2. 配置网页
打开 `index.html`，搜索：
- `在这里填入你的 Supabase Project URL`
- `在这里填入你的 Supabase anon public key`

把两处分别替换为刚才复制的 URL 和 anon public key。不要把 service_role key 放进网页。

### 3. 发布网页
1. 把 `index.html` 上传到 GitHub 仓库（仓库内放在根目录）。
2. 登录 https://vercel.com/ ，选择 Import Project，连接该仓库并部署。
3. 部署完成后会得到一个 `https://....vercel.app` 分享网址。

### 4. 邀请朋友
1. 你和朋友打开同一个网址。
2. 点击“加入 / 创建旅行房间”，输入相同的房间代号。
3. 每个人填写自己的昵称。
4. 城市、预算和留言会通过 Supabase 实时同步。

## 重要说明
- 当前版本使用“房间代号”区分旅行小组，知道代号的人可加入。请使用不容易猜到的房间代号。
- 当前 SQL 为方便朋友小组快速试用，采用宽松匿名访问策略；不要保存个人隐私、证件、支付信息。若要长期公开使用，应升级为 Supabase Auth 登录、成员邀请和基于成员身份的 RLS 权限。
- 交通费用由用户手动填写，不会自动抓取实时票价。
- 地图使用 OpenStreetMap 底图，浏览器需要联网。
- 若数据库开启 Realtime 时提示表已加入 publication，可忽略对应重复添加提示。
