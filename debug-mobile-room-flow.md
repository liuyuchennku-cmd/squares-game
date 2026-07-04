# Debug Session: mobile-room-flow
- **Status**: [OPEN]
- **Issue**: 手机版无法创建和加入 Firebase 房间，网页版正常。
- **Debug Server**: http://192.168.1.124:7777/event
- **Log File**: .dbg/trae-debug-log-mobile-room-flow.ndjson

## Reproduction Steps
1. 在手机浏览器打开线上 `firebase-online.html` 页面。
2. 点击“创建房间”或输入房间号后点击“加入房间”。
3. 观察是否进入房间，或是否停留在失败状态。

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | 移动端在 `ensureFirebaseReady()` 阶段没有拿到匿名用户，链路在 Auth 初始化前就中断。 | High | Low | Confirmed |
| B | 移动端能完成 Auth，但在 `runTransaction()` 写房间或占座时被 Firebase 拒绝或网络失败。 | High | Low | Rejected |
| C | 移动端创建成功了，但在 `loadRoomSession()` 读取房间或玩家列表时失败，所以表面看起来像“不能创建/加入”。 | Medium | Low | Rejected |
| D | 移动端点击事件或按钮状态被别的交互层拦截，实际没有进入 `createOnlineRoom()` / `joinOnlineRoom()`。 | Medium | Low | Rejected |
| E | 移动端环境下某个浏览器能力差异导致请求已发出但响应解析或后续监听异常。 | Medium | Medium | Partially confirmed |

## Log Evidence
- 手机截图显示：点击“创建房间”后出现 `[D] createRoom:click` 与 `[D] createOnlineRoom:start`，说明点击链路正常，排除 D。
- 同一张手机截图里 `ensureFirebaseReady:start` 显示 `hasCurrentUser=false hasDb=true hasApp=true hasAuthReadyPromise=true`，且后续没有出现 `A:onAuthStateChanged` 或 `B:createOnlineRoom:transaction:start`，说明链路卡在复用旧的 `authReadyPromise`。
- 网页版截图显示完整路径：`A:ensureFirebaseReady:init -> A:onAuthStateChanged -> B:createOnlineRoom:transaction:success -> C:loadRoomSession:success`，说明房间事务和读取逻辑本身正常，排除 B/C。
- 代码证据：页面底部存在启动即执行的 `reconnectOnlineRoom(false)`，它会在用户手动点击前调用 `ensureFirebaseReady()`。
- 新一轮手机截图表明：即使跳过了移动端自动重连，手动点击后的首次 `ensureFirebaseReady()` 仍可能挂住，因此根因不止是自动重连，还包括移动端匿名登录 promise 本身可能长期不 resolve。

## Verification Conclusion
- 根因：真手机环境里，页面加载时自动执行的 `reconnectOnlineRoom(false)` 先触发了 `ensureFirebaseReady()`；该次匿名登录在移动端未完成，留下一个未 resolve 的 `authReadyPromise`。后续手动“创建房间/加入房间”再次调用 `ensureFirebaseReady()` 时复用了这个悬挂 promise，导致链路卡死，永远到不了创建事务阶段。
- 最小修复：在真手机环境禁用“页面加载即自动重连”，只保留用户手动点击“重连上次房间”时再触发；这样不会预先污染 `authReadyPromise`，并且不影响桌面端当前正常行为。
- 追加修复：`ensureFirebaseReady()` 现在不再只等待 `onAuthStateChanged`，还会直接接受 `signInAnonymously()` 的成功结果；同时对悬挂的 Auth 初始化增加超时重置和一次自动重试，避免第一次点击留下死 promise 后后续所有点击都被卡住。
