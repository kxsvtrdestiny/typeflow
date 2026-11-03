# 第八阶段交付报告

日期：2026-11-03（Asia/Shanghai）。状态：开发与云端验证完成，等待用户 Windows 人工验收；未进入第九阶段。

## 功能与统计口径

- 每日目标：默认 20 分钟，可在设置保存 1–1440 整数分钟；首页显示有效分钟、目标、进度与完成状态，仅统计成功保存的历史。
- 错误分析：中文/英文独立，按错误次数或错误率查看前 8 个易错标准字符，同时显示匹配样本数。使用结束时正式保留输入与标准字符的 grapheme 索引匹配，删除及修正后的旧错误不残留；不存用户输入全文或错误替代字符序列。
- 训练习惯：当前连续、历史最长连续、本周训练天数；同日本地完成日期去重，周一为一周起点。今天尚未训练时保留昨天结束的连续天数。
- 日期：以当前浏览器本地完成日期归属；跨午夜的一次训练全部归完成日，数据没有分段信息，不能虚构拆分。午夜与恢复前台时重新计算；日历序号避免夏令时断档。
- 数据联动：全部由已有历史 Store 派生，删除/清空同步重算；关闭自动保存或保存失败不会增加新目标、天数、分析数据。
- 兼容：历史与设置写入版本升级为 2，兼容读取 v1；旧记录不补造字符分布。v1 未开放的目标字段迁移为 20 分钟，其他偏好保留，下一次成功写操作才更新磁盘版本。损坏/未知数据不静默覆盖。

## 文件变更

新增：

- src/utils/trainingInsights.ts：目标、日历天数、最终字符聚合及错误排名纯函数。
- src/hooks/useLocalDate.ts：本地午夜、焦点与可见性日期刷新。
- src/components/dashboard/DailyGoal.tsx：紧凑首页目标。
- src/components/common/DailyGoalSetting.tsx：目标设置表单。
- src/components/history/TrainingInsights.tsx：习惯与折叠错误分析。
- src/utils/trainingInsights.test.ts：16 项新增单元测试。
- tests/e2e/insights.spec.ts：7 项新增浏览器测试。
- imgs/stage8-*.png：7 张实际运行截图。
- 本报告。

修改：

- src/types/index.ts：可选、版本化的字符聚合契约。
- src/utils/historyStorage.ts：v1/v2 兼容、聚合校验及显式字段保存。
- src/utils/settingsStorage.ts、src/stores/useSettingsStore.ts：20 分钟默认值、目标校验及版本读写。
- src/components/typing/TrainingSession.tsx：仅在原有完成快照处追加聚合，不改变输入监听器或状态机。
- src/pages/Dashboard.tsx、History.tsx、Settings.tsx：接入独立组件。
- src/index.css：新组件样式，未改动打字区域布局规则。
- README.md、dist：技术说明与生产构建。

未修改 DEVELOPMENT.md、package.json、package-lock.json、核心 useTyping/useTimer、IME、英文测量/自然排版、字符匹配与速度公式。node_modules 仍被忽略，没有新增依赖。

## 验证结果

| 命令/检查 | 结果 |
| --- | --- |
| npm test | 12 个文件、99 项单元/组件测试全部通过 |
| PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e | 58 项全部通过 |
| npm run typecheck | 通过 |
| npm run build | 通过，dist 已更新 |
| 实际 dist /typeflow/ | 目标设置刷新、5 轮正式结果保存、v2 字符聚合、习惯、错误语言切换、图表和移动端布局全部通过 |
| 既有生产导入流程 | TXT BOM/换行/取消、DOCX Worker 保存与训练、五路由刷新、历史持久化和懒加载趋势继续通过 |
| Git 文件检查 | node_modules 被忽略、无跟踪文件；dist 保留；源码/文档无空白格式错误 |

新测试覆盖：目标累计与修改、删除联动、正确与错误分母、中文 grapheme/组合字符、英文大小写、空格标点换行、退格及重新输入、旧记录无明细、v2 损坏与未知分析版本保护、设置迁移、当前/最长/本周天数、同日去重、本地午夜自动刷新、实际跨午夜完成及纽约夏令时 23 小时日期边界。第四至第七阶段全部原有回归保留通过。

## 截图

截图数据由独立自动化浏览器实际完成 5 轮默认文章训练，经正式完成/保存流程产生，日期及有效时间由测试时钟控制；不是预置数据或真实用户成绩。演示目标手动改为 3 分钟，产品默认仍为 20 分钟。

[首页](../imgs/stage8-dashboard.png) · [设置](../imgs/stage8-goal-settings.png) · [中文分析](../imgs/stage8-history-insights.png) · [英文分析](../imgs/stage8-english-errors.png) · [移动首页](../imgs/stage8-dashboard-mobile.png) · [移动分析](../imgs/stage8-history-mobile.png) · [深色分析](../imgs/stage8-dark-insights.png)

## 遗留限制

未发现已知阻塞缺陷。旧记录没有字符明细且不会被补造；错误率没有最低样本门槛，展示匹配数供判断；跨午夜不按时间片分摊。时区改变会按新本地时区重新归类日期。localStorage 仅限当前站点，不跨设备同步，不提供跨标签事务。

第八阶段新增目标、日期口径、版本升级及分析交互仍待 Windows 人工验收。GitHub Pages 发布分支更新与公网部署结果须区分；此前云环境代理阻止公网/API 检查，不把推送成功表述为公网部署已确认。
