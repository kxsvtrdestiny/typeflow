# typeflow

TypeFlow 是计划中的中英文打字练习平台。当前完成第四阶段核心打字训练：首页、词库管理、本地词库保存、双排输入匹配、IME 事件处理及训练状态已实现。速度统计和成绩历史仍待后续阶段。完整需求和验收计划见 [DEVELOPMENT.md](./DEVELOPMENT.md)。

## 技术栈

Vite、React、TypeScript、TailwindCSS（Vite 插件）、React Router（HashRouter）、Zustand、Recharts、Lucide React、Mammoth、date-fns。安装版本由 package.json 和 package-lock.json 锁定。测试使用 Vitest、React Testing Library、Playwright。

## 开发和验证

在仓库根目录运行以下命令；Codex 云端任务由代理直接执行，无需用户本地执行：

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

浏览器测试首次运行前需要安装 Playwright Chromium 及其系统依赖：

```sh
npx playwright install chromium
npm run test:e2e
```

如果缺少系统依赖，使用 Playwright 官方安装流程补齐，不关闭下载验证。测试服务器由 Playwright 自动启动并关闭。

当前云环境已提供 `/usr/bin/chromium`。官方浏览器下载域名被网络策略拦截时，可使用现有浏览器运行：

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

当前执行沙箱需要获准的执行权限才能访问环境代理、启动本地测试服务器及浏览器。Codex 负责执行，无需用户在本地操作。

## 目录

- src/pages：五个主页面、词库详情与未找到页面，目前均为占位。
- src/components：layout、dashboard、typing、library、common。
- src/types/index.ts：语言、主题、文章、训练配置、统计、记录和设置的基础契约。
- src/hooks、src/stores、src/utils、src/data、src/assets：后续阶段模块预留目录。
- src/test、tests/e2e：组件测试初始化与浏览器冒烟测试。
- public、imgs：静态资源和后续真实截图预留目录。
- dist：npm run build 生成的生产文件，按学校要求保留；node_modules、测试报告及本地环境变量被忽略。

## 静态部署

Vite base 使用 ./，路由使用 URL hash，适配静态服务器和子目录。生产构建须同时通过 TypeScript 检查。可通过 npm run preview 检查构建结果，最终交付还会验证 serve ./dist。

## 当前限制

当前尚不包含完整速度统计、限时挑战、成绩历史及文件导入；词库数据保存和核心打字输入已实现。后续逐阶段实现并验证，不能将当前占位页视为已完成业务。Windows 中文输入法及真实手机键盘需要实际设备验收；云端事件模拟不能代替该验证。

## 第一阶段版本与验证

云端使用 Node.js 24.19.0、npm 11.9.0。项目版本由锁文件固定：

| 包 | 版本 |
| --- | --- |
| date-fns | 4.4.0 |
| lucide-react | 1.66.0 |
| mammoth | 1.13.0 |
| react | 19.3.1 |
| react-dom | 19.3.1 |
| react-router-dom | 7.18.5 |
| recharts | 3.10.1 |
| zustand | 5.0.16 |
| @playwright/test | 1.64.1 |
| @tailwindcss/vite | 4.3.3 |
| @testing-library/jest-dom | 7.0.1 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.8 |
| @types/node | 26.6.6 |
| @types/react | 19.3.0 |
| @types/react-dom | 19.3.0 |
| @vitejs/plugin-react | 6.2.1 |
| jsdom | 30.1.3 |
| tailwindcss | 4.3.3 |
| typescript | 7.0.2 |
| vite | 8.3.5 |
| vitest | 5.0.5 |

已执行：TypeScript 检查、8 项路由/导航组件测试、1 项 Chromium 浏览器冒烟测试、生产构建，均通过。浏览器检查涵盖 hash 导航、刷新、词库详情占位及 Tailwind 样式加载。需求文档 SHA-256 与初始化前一致。完整业务验收仍按 DEVELOPMENT.md 的后续阶段推进。

## 第二阶段：布局与首页

- 主布局拆分为 AppLayout、Sidebar、Header，Zustand 仅管理移动端菜单状态。
- 首页拆分为统计、语言入口、主题推荐和最近训练组件；没有真实成绩时显示 0 或“—”，不使用模拟训练数据。
- 中英文入口携带 language 查询参数导航至训练占位页；本阶段不解析或执行训练业务。
- 主题区保留 12 个规划主题数据，首页默认显示三个中文推荐，可切换三个英文推荐；卡片仅展示名称、难度和语言，点击携带 language 与 theme 参数进入训练占位页。实际文章将在第三阶段添加。
- 移动端菜单支持遮罩、Esc、焦点循环和关闭后恢复焦点；桌面固定显示侧边栏。
- 保留第一阶段全部测试断言；原浏览器测试选择器限定到首页 h1 与精确导航文字，以适应新增内容。
- 第二阶段验证：8 项组件测试、6 项 Chromium 浏览器测试；包括桌面五页切换/刷新、320/390/768px 布局与菜单、横向溢出检查、语言入口及主题数量。TypeScript 检查及生产构建通过。
- 截图为云端 Chromium 实际渲染，真实手机与其他浏览器尚未人工验证。

### 当前首页截图

![桌面端首页](./imgs/dashboard-desktop.png)

[查看移动端首页截图](./imgs/dashboard-mobile.png)

### 首页视觉精简

已移除首页标题及欢迎区的宣传副文案，压缩欢迎区、统计卡片和最近训练空态；语言入口仅保留名称和简短说明。主题区支持中文/English 切换、“查看全部”及主题卡片跳转。主题跳转目前导航至现有训练占位页并保留参数，尚不包含训练业务。新截图覆盖上方桌面和移动端截图。8 项组件测试、6 项浏览器测试及 TypeScript/生产构建通过。

## 第三阶段：默认词库与词库管理

### 已完成功能

- 默认中文、英文各 6 个主题，每主题 5 篇独立标题的原创完整短文，共 60 篇。名言主题为明确标注的原创表达，新闻主题为媒体素养练习，不虚构名人出处或新闻事件。
- 默认主题与文章只读。UI 不显示修改入口，Store 也拒绝对默认 ID 的增删改。
- 词库支持中文/English 分类、主题名称搜索（英文大小写不敏感）、难度筛选和空状态。
- 自定义主题支持名称、描述、语言、难度编辑和确认删除。文章支持标题、完整内容、独立难度、字符数、编辑及确认删除。
- 文章字符数使用 Intl.Segmenter 按字符簇统计，包含空格与换行。保存时统一换行并去除起始 BOM，不删除正文空格。
- 首页推荐和文章“开始练习”均可衔接现有训练准备页，显示已选主题及文章。URL 携带语言、主题信息，文章入口还携带 themeId/articleId；引用被删除后显示重新选择提示。未实现输入、计时或成绩逻辑。

### localStorage 约定

Zustand 管理自定义词库和修改动作，存储键为 typeflow.library，格式为 `{ version: 1, data: LibraryTheme[] }`。仅保存自定义数据，默认内容由应用静态模块提供，首次访问自动可用，后续不会重复追加。写入成功后才更新内存；保存失败保留编辑表单，提示失败，不能当作保存成功。

读取时校验版本、字段、日期和 ID 唯一性。损坏或不支持版本的数据不会被覆盖，界面提示并阻止自定义修改；默认库仍能使用，可在备份/修复浏览器数据后重试读取。尚无旧版 schema，因此不猜测迁移未知版本。数据仅保存在当前浏览器，不会同步到其他设备；清理浏览器站点数据会移除自定义内容。

主题名称最多 80 字符，描述最多 1000 字符；文章标题最多 120 字符，正文最多 100000 个 UTF-16 码元。限制同时在表单和 Store 校验，防止过大的输入耗尽本地容量。TXT/DOCX 导入仍留待第七阶段。

### 验证与截图

第三阶段实际执行：TypeScript 检查、19 项单元/组件测试、9 项 Chromium 浏览器测试及 npm run build，均通过。浏览器覆盖默认词库、搜索筛选、主题/文章增删改、删除取消、刷新保留、只读保护、异常数据保护、移动端溢出及首页/导航回归。未在真实手机或其他浏览器人工验证。

![词库管理](./imgs/library-desktop.png)

[英文词库](./imgs/library-english.png) · [文章详情](./imgs/library-detail.png) · [移动端词库](./imgs/library-mobile.png)

## 第四阶段：核心打字训练

### 输入与同步原理

先以固定中英文文本完成匹配、IME 与状态单元测试，再接入第三阶段真实词库。useTyping 管理临时训练状态；TypingArea 接收原生 textarea 输入；typingCharacters 负责分段、匹配及共享断行；imeInput 独立处理组合事件。

- 标准文本与正式输入统一使用 Intl.Segmenter 的 grapheme 模式分段，原生 selectionStart 的 UTF-16 偏移映射到字符簇索引。
- 每个索引生成唯一 slot，上下两行使用同一 slot 数组及统一格宽和行高（中文 32px；英文采用实际测量字宽）。ResizeObserver 计算列数，两行一起重排，标准 LF 强制断行；错误输入的 LF 只显示 ↵，不能单独改变下排布局。
- 正确位置上下均绿色，错误上下均红色并附下划线，当前输入格蓝色。空格以 · 显示，LF 以 ↵ 显示，Tab 以 ⇥ 显示，比较时仍为原字符。英文大小写、标点、全角半角均严格区分。
- 输入使用完整 value 快照重新匹配；错误会占用自己的格子，不改变两层的物理位置。漏字仍按位置顺移判错，不做编辑距离对齐。退格、Delete、方向键、选区替换由浏览器原生编辑，修改后重新计算。
- 只有一个滚动容器，当前行超出视口才滚动。textarea 定位到可视光标附近，使原生候选窗尽量靠近当前格；真实 Windows 候选窗位置仍需实机确认。

### IME 事件边界

textarea 不绑定受控 value。compositionstart 标记组字；compositionupdate 只更新预编辑提示；组合期间 input/change 不提交。compositionend 读取浏览器的最终 value，随后 input/change 按完整快照去重。没有用 keydown 的按键名拼接文字，也不拦截候选选择用的 Space、Enter 或数字键。

暂停与重开取消预编辑，恢复到最后正式快照；暂停按钮避免指针先移动焦点导致意外提交。继续后恢复输入焦点。组合期间不强制写回 textarea，不移动其选择区。拼音预览不参与匹配、正确数、错误数和进度；组合已提交的多字候选作为一次完整快照匹配。

### 状态与预留数据

状态为 idle → running → paused/running → completed。需要点击“开始训练”，首次非空正式提交才记录 startedAt 和 performance.now() 时间基准。输入覆盖文章长度后自动完成（允许错误），完成后锁定输入；额外字符保留并标错。

useTyping 暴露 submittedCharacters、correctCharacters、incorrectCharacters、progress、session.startedAt、session.accumulatedMs 与 elapsedMs()。elapsedMs() 使用真实单调时间差，扣除暂停时间；没有启动周期计时器或实现第五阶段速度指标。重新开始回到 idle 并清空数据。

训练文章内容以本次会话快照冻结，不随词库编辑改变。语言、主题、文章切换会创建新会话；正在训练时切换或点击站内链接会确认丢弃输入。页面刷新提示由浏览器处理，未完成输入不持久化。浏览器前进/后退仍按 URL 重新加载对应会话。

### 自动化验证结果

本阶段执行 32 项单元/组件测试、13 项 Chromium 浏览器测试（含之前全部 9 项），并执行 TypeScript 检查与 npm run build。固定中英文文本验证完成后才接入真实词库；真实词库入口及首页、词库增删改的回归也已通过。

| 验收范围 | 验证方式与结果 |
| --- | --- |
| 中文正确/错误输入、Backspace、删除后修正 | 固定文本单元测试及浏览器输入，通过 |
| 组合输入、候选提交、连续组合、取消与重复事件 | 独立 IME 单元测试、浏览器合成 composition/input 事件，通过；不是 Windows 实机测试 |
| 英文正确/错误、大小写、空格、标点、Enter | 浏览器键盘编辑与严格匹配测试，通过 |
| 快速连续输入、错误后继续输入、选区/方向键编辑 | 连续快照单元测试及浏览器按键测试，通过 |
| 自动换行、上下格对齐、混合 Unicode、宽度变化 | Chromium 检查每对格的横坐标、宽度及固定 38px 上下行距，通过 |
| 长文自动滚动 | 输入多段长文，检查 scrollTop 大于零且当前格仍在视口内，通过 |
| 暂停不收输入、继续、重开、完成后锁定 | Hook 状态单元测试与浏览器测试，通过 |
| 切换文章清空旧值与进度 | 浏览器测试，通过 |
| 原有页面、路由刷新、词库管理与首页推荐 | 原有测试回归，通过 |

### 必须保留的人工验收项

云端 Chromium 中的输入方法调用和合成 composition 事件不能验证真实系统候选窗。Windows Chrome/Edge + 微软拼音仍需人工测试：候选窗定位；Space/Enter/数字选词；多字候选；连续组词；取消候选；组合中退格；鼠标暂停、继续、重开；缩放及滚动时输入是否稳定。搜狗输入法、真实手机键盘和 Safari 也尚未实机验证，不能宣称已经兼容通过。

### 尚未实现

第五阶段的 CPM/Gross WPM/Net WPM、准确率展示、实时计时展示与限时挑战；第六阶段的完整结果页、成绩自动保存和历史图表；后续文件导入、目标及错误分析均未提前开发。

![中文练习](./imgs/practice-chinese.png)

[英文练习](./imgs/practice-english.png) · [移动端练习](./imgs/practice-mobile.png)

### 第四阶段视觉复核

英文字符格由 32px 收紧至 22px，中文保持 32px。CSS 变量是两行格宽、原生输入框宽度及列数测量的共同来源；索引、字符分段、匹配、IME 与 useTyping 状态逻辑未修改。空格点号使用 0.38 透明度，仅弱化标记本身，错误背景、下划线和当前光标仍保留。

复核暂停/继续的状态守卫、暂停扣时、重开清空、文章身份重建与监听器清理，未发现本轮需要修改的状态逻辑。新增英文/中文格宽与对齐、空格样式、重复暂停继续、取消文章切换保留输入的浏览器断言。最终 32 项单元/组件测试、15 项浏览器测试、TypeScript 检查及生产构建通过；中英文与移动端截图已更新。Windows 实际输入法仍需人工验收，没有开始第五阶段。

### 英文自然字宽排版（当前方案）

英文不再使用 22px 或其他统一格宽。TypingArea 的英文文本使用 Arial/Helvetica Neue 比例字体，正常 letter-spacing，普通空格，不显示点号。useTypingLayout 根据当前实际字体、字号、字重，使用 Canvas measureText 测量标准答案的每个 grapheme；无 Canvas 时使用隐藏 DOM 测量实际字宽，不以固定宽度替代。两排使用同一个 widths 数组，错误字符也占用标准答案对应宽度，超宽错字裁剪到对应位置，错误背景仍保留。

英文断行按可用像素宽度计算，优先在单词边界换行，超长单词按字符簇拆分；标准 LF 强制换行。上下两排共用同一组行，不各自独立排版。跨字符 kerning 与 ligature 关闭以保持独立可寻址字符和 Canvas/DOM 测量一致，未人为增加字母间距。中文仍使用原来的 32px 字符布局及淡空格标记。

ResizeObserver、窗口 resize、document.fonts.ready 与 loadingdone 都会触发重新测量，处理窄屏及字体加载后的重排。字符索引、匹配工具、useTyping 状态和 IME 控制器保持原样。

验证：34 项单元/组件测试、16 项 Chromium 浏览器测试全部通过，TypeScript 检查及 npm run build 通过。新增检查包括 iii/WWW 比例宽度差异、整句宽度与普通文本参照误差小于 1px、普通空格、宽错字仍占窄答案格、字体 FontFace 加载后重新测量、窗口缩放和 CSS zoom=1.25 的双排坐标一致性。CSS 缩放是自动化模拟，不代替不同系统实际浏览器缩放和输入法的人工验收。

[当前英文页面](./imgs/practice-english.png) · [英文移动端](./imgs/practice-english-mobile.png)
