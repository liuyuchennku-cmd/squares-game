# 方格游戏 Firebase 云联机版部署说明

这版使用纯 HTML / CSS / JS，前端可以放到 GitHub Pages；联机房间、棋盘同步、匿名身份、战绩和排行榜放在 Firebase Firestore。

## 文件

- `firebase-online.html`：Firebase 云联机页面。
- `firebase/firebase-config.js`：Firebase Web App 配置，部署前需要替换里面的占位值。
- `firebase/firebase-config.example.js`：配置模板。
- `firebase/firestore.rules`：Firestore 原型版安全规则。
- `docs/棋子说明书.html`：游戏说明书。

## Firebase 控制台设置

1. 创建 Firebase 项目。
2. 在 Authentication 里启用 `Anonymous` 匿名登录。
3. 创建 Firestore Database，建议先选测试区域附近的 region。
4. 在 Project settings 里新增 Web App，复制 `firebaseConfig`。
5. 把复制到的配置填入 `firebase/firebase-config.js`。
6. 运行 `firebase deploy --only firestore:rules` 发布 `firebase/firestore.rules`。

如果后续部署到 GitHub Pages，还需要在 Authentication 的 Authorized domains 里加入：

```text
你的用户名.github.io
```

## 本地运行

不建议直接双击 HTML 用 `file://` 打开。用本地 HTTP 服务更接近 GitHub Pages 环境：

```bash
cd squares_game
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000/firebase-online.html
```

## GitHub Pages 部署

把这些文件上传到仓库：

- `firebase-online.html`
- `firebase/firebase-config.js`
- `firebase/firebase-config.example.js`
- `firebase/firestore.rules`
- `firebase/firestore.indexes.json`
- `docs/棋子说明书.html`

在 GitHub 仓库 Settings → Pages 里启用 Pages，选择主分支和根目录。部署后访问：

```text
https://你的用户名.github.io/仓库名/firebase-online.html
```

## 当前实现的数据结构

```text
rooms/{roomId}
  roomId
  mode
  boardSize
  status
  hostUid
  snapshot
  createdAt
  updatedAt

rooms/{roomId}/players/{uid}
  uid
  name
  color
  host
  connected
  joinedAt
  lastSeen

rooms/{roomId}/colorSeats/{color}
  color
  uid
  occupiedAt

rooms/{roomId}/results/final
  scores
  winnerIds
  finishedAt

rankings/{uid}
  uid
  name
  games
  wins
  remainingTotal
  updatedAt
```

## 重要限制

这一版是最低成本原型：主要规则校验仍在前端。Firestore Rules 可以限制匿名登录、房主操作和房间成员写入，但不能完整验证每一步落子是否合法。

如果以后要做正式公开联机和防作弊，建议增加 Cloud Functions 或自建后端，把落子合法性、结算和排行榜写入放到服务端执行。
