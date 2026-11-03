# 字律 TypeRhythm

中英文输入训练平台，原名 TypeFlow。支持本地词库、中文输入法、自然英文排版、自由/限时训练、成绩历史、每日目标和错误分析。文件解析及用户数据均在浏览器本地处理，没有后端上传或账号系统。

[在线演示](https://kxsvtrdestiny.github.io/typeflow/) · [最终验收报告](docs/FINAL_ACCEPTANCE.md) · [学校提交说明](docs/SUBMISSION_GUIDE.md) · [原始需求](DEVELOPMENT.md)

## 运行与构建

需要 Node.js **22.12+**，推荐 Node.js 24 LTS。锁文件固定依赖版本。

```sh
npm ci
npm run dev
```

终端显示 Vite 开发地址后用浏览器打开。生成生产文件：

```sh
npm run typecheck
npm run build
cd dist
npx serve .
```

浏览器访问 serve 输出的地址。不要直接双击 index.html；DOCX Worker、模块脚本等需要 HTTP 静态服务。dist 已随作业保留，无需构建也可直接用静态服务器预览。

Vite 使用 `base: './'`，路由采用 HashRouter，因此可以在根目录或子目录部署，`#/practice` 等路由刷新不依赖服务器重写。学校源码路径是 `week02/homework/typing/`，**不要求改变网站内部路由或包名**。

## 技术栈与功能

| 技术 | 用途 |
| --- | --- |
| React 19、TypeScript 7、Vite 8 | 组件、类型检查、构建 |
| TailwindCSS 4 与项目 CSS | 统一蓝紫色视觉、深浅主题、响应式布局 |
| React Router 7、Zustand 5 | 页面路由与设置/词库/历史状态 |
| Recharts 3、Lucide React、date-fns 4 | 分语言速度趋势、图标、本地日期显示 |
| Mammoth 1 | DOCX 纯文本提取 |
| Vitest、Testing Library、Playwright | 单元、组件及真实浏览器验证 |

完整版本见 package.json/package-lock.json，无需手动选择版本。

- 首页：真实训练汇总、每日目标、语言入口、主题推荐和最近三次记录。
- 词库：12 个只读默认主题、60 篇原创文章；自定义主题/文章增删改、搜索及语言筛选。
- 导入：TXT/DOCX 本地解析，预览后修改标题、主题、正文，确认才保存。
- 训练：中文/英文、自由或 1/3/5/10 分钟限时、暂停/继续/重开、结果、严格大小写/标点/空格匹配。
- 历史：成绩快照、筛选排序、详情、单条删除/清空、独立中文 CPM/英文 WPM 趋势。
- 拓展：每日目标默认 20 分钟；当前/最长连续训练、本周训练天数；全部易错字符的次数和错误率分析。
- 设置：深浅色、默认语言/模式/时长、独立正确/错误音效、自动保存及有确认的数据重置。

## 核心技术实现

### 字符索引与双排显示

`Intl.Segmenter(granularity: 'grapheme')` 统一分段；emoji、组合字符使用 grapheme 索引，textarea 的 UTF-16 选区偏移通过 offsetToIndex 转换。输入前将 CRLF/CR 统一为 LF，去掉起始 BOM；不裁剪空格，不转换大小写或全半角。

中文沿用 32px 字符格，共享索引、分行与成对滚动区域。英文按实际 CSS 字体用 Canvas measureText 测量（Range 作为降级），考虑字形外伸和亚像素向上取整；字体加载与窗口变化后重新布局。

**英文答案和实际输入共享逻辑索引与答案分行，行内按各自自然字宽渲染。** 标准答案宽度、换行只依赖标准文本、字体及容器；错误输入不改变答案排版。较宽错误字符完整显示，行内允许横向滚动；不承诺错误字符与答案逐像素同列。光标跟随实际输入选区，正确/错误状态始终按索引判断。

### 中文 IME 与正式提交

原生、非受控 textarea 接收输入。compositionstart/update 只预览组词，不判错、不计时/计分、不播放音效；compositionend 读取浏览器提交值，后续 input/change 通过值与事件身份去重。正式输入不依赖 keydown。Backspace、选区编辑沿用浏览器行为，未提交拼音不进入最终结果。训练区禁止粘贴和拖入，长文本应先导入词库。

### 指标与有效计时

- CPM = 当前正确 grapheme 数 / 有效分钟数。
- WPM = (当前正确字符数 / 5) / 有效分钟数。
- 当前准确率 = 当前正确字符数 / 当前保留输入字符数 × 100%。
- 累计准确率 = 累计正确输入事件字符数 / 累计输入事件字符数 × 100%。删除会改变当前值，不清除历史输入事件计数。
- 进度 = 当前输入 grapheme 数 / 标准答案总数，上限 100%。

空格、标点、换行均按一个 grapheme 参与严格比较；零输入/零有效时间显示 0，不产生 NaN/Infinity。第一次正式输入启动计时，使用 performance.now() 的真实时间差，显示计时器不承担累加计时。暂停、失焦和后台隐藏不计时，恢复需手动继续。到期或文章输入长度达到标准长度时结束（允许包含错误），完成后冻结结果；重开/切文重置。

### 本地状态、成绩与版本

Zustand + localStorage 使用独立键：`typeflow.library`（v1）、`typeflow.settings`（v2）、`typeflow.history`（v2）。品牌更名保留原键。历史/设置兼容读取 v1，下一次成功写操作才保存 v2；旧设置未开放的每日目标预留值迁移为 20 分钟，其他偏好保留。未知版本或损坏数据保留原文并提示，防止静默覆盖；写成功才更新对应状态，不假装保存成功。

只在有效完成时保存已结算成绩、主题/文章名称快照和聚合数据；每轮 UUID 去重。有效记录须有输入与正有效时间，暂停/重开/未完成离开不保存。不持久化完整文章正文、实际输入全文或进行中的训练。删除文章不影响历史名称。首页、历史和拓展统计直接从同一历史 Store 派生。

自动保存及音效设置在新一轮开始时冻结；关闭自动保存仍显示结果，不写历史、不补存旧成绩。入口明确指定的语言/文章/模式优先于默认设置。重置只处理上述三个键，不调用 localStorage.clear()，保留只读默认词库；部分失败明确反馈。

### 导入、音效与错误分析

TXT 默认严格 UTF-8，处理 BOM/换行；编码错误可手动尝试 GB18030，取决于浏览器 TextDecoder 支持。DOCX 通过 Worker 中的 Mammoth extractRawText 提取纯文本，不上传，不插入 HTML。取消不创建文章；文件上限 2 MiB，正文最多 100000 个 UTF-16 代码单元；DOCX 声明解压总量不超过 8 MiB/512 条目，拒绝加密/ZIP64，解析 10 秒超时终止。导入限制不等于任意大文档均可流畅训练。

音效默认关闭，开始/继续时在用户交互中解锁 AudioContext；异步恢复完成后播放约 100ms 的本地提示音，错误 440Hz、正确 660Hz。仅正式提交新字符触发，IME 预览、删除、暂停/结束不播放；失败提示重试，不影响输入。浏览器/系统静音无法由应用可靠检测。

新记录额外保存 characterAnalysis v1：标准字符、已比较次数 attempts、错误次数 errors。仅分析结束时保留输入，删除/修正过的错误不残留，不保存实际替代字符。错误率 = 错误次数 / 已比较次数 × 100%；同字符跨记录累加分子分母，中文按 grapheme、英文区分大小写。全部错误字符可查看，桌面双列、手机单列。旧记录没有分布时明确空态，不推断历史明细。

每日目标与训练天数只使用成功保存的有效记录，不包含暂停或未保存成绩。采用浏览器本地完成日期；跨午夜整次归完成日，不虚构时间片。午夜/恢复前台重新检查。当前连续可延续至昨天，最长连续按日历日计算，本周从周一开始，同日多次只算一天，避免夏令时 23/25 小时造成断档。

## 关键问题与修复

| 问题 | 定位与方案 |
| --- | --- |
| 固定英文字符格造成字母间距过大 | 改为实际字体自然字宽，移除人工字母间距 |
| 窄答案字符裁切宽错误字母 | 输入字形独立测量，考虑墨迹边界，不用答案宽度裁切 |
| max(答案宽度, 输入宽度) 导致答案随错误移动 | 标准答案布局与实际输入解耦，仅共享索引和答案分行 |
| IME 候选后重复 input/change | 组合期间不正式提交，提交值/事件身份去重 |
| 提示音在 AudioContext 恢复前丢失 | 等待异步恢复，检查轮次/状态，失败反馈及重试 |
| 删除记录后统计漂移 | 所有汇总、目标、习惯与错误分析从同一记录集合派生 |
| 窄屏趋势图 tooltip 溢出 | 限制图表绘制边界并增加缩放/悬停回归 |
| 最终检查发现弹窗偏左、长主题名溢出、favicon 404 | 居中 margin、主题名断行、补齐同风格 favicon；不改训练核心 |

完整演进、修复前后截图和当时的测试记录保存在 [开发记录](docs/DEVELOPMENT_LOG.md)。各阶段报告属于历史快照，当前验收状态以最终报告为准。

## 测试

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run build
```

云环境可使用已安装的 Chromium：

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

`npm test` 包含单元/组件测试；Playwright 覆盖路由、词库 CRUD、导入、IME 事件、实际字符坐标/可见性、计时、存储异常、统计和响应式。不要同时启动两轮 Playwright，以免共享端口与输出目录冲突。

生产静态服务启动后，可额外运行：

```sh
node scripts/verify-production.mjs http://localhost:3000/
```

其浏览器路径也支持 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH，验证五路由刷新、TXT/DOCX Worker、实际训练结算、v2 历史和图表，不操作真实用户浏览器数据。**最终验证：100 项单元/组件测试、65 项 Playwright 浏览器测试、TypeScript 检查与生产构建全部通过。** 性能样本及 Windows 实机验收边界见 [最终报告](docs/FINAL_ACCEPTANCE.md)。

独立压力检查可运行 `node scripts/measure-performance.mjs http://localhost:3000/`。包含 10 万字符上限样本，可能明显卡顿；它使用隔离浏览器数据，并输出本机测量结果，不代表通用性能指标。

## 目录与截图

```text
typing/
├── README.md / DEVELOPMENT.md
├── package.json / package-lock.json
├── index.html / vite.config.ts / tsconfig*.json
├── playwright.config.ts / vitest.config.ts
├── src/
│   ├── components/  # layout、typing、library、history、dashboard、common
│   ├── pages/       # 首页、训练、词库/详情、历史、设置
│   ├── hooks/       # IME 接入、计时、测量、音效、保存与日期刷新
│   ├── stores/      # 词库、历史、设置、侧栏状态
│   ├── utils/       # 分段、匹配、统计、导入、版本校验
│   ├── data/        # 默认 12 主题、60 篇原创文章
│   ├── types/ / test/
│   └── index.css / main.tsx / App.tsx
├── public/          # favicon、.nojekyll
├── tests/e2e/ / tests/fixtures/
├── scripts/         # 独立生产验证
├── docs/            # 验收、性能、提交说明与开发记录
├── imgs/            # 真实应用截图及修复对比
└── dist/            # 已构建生产文件，必须提交
```

[最终首页](imgs/final-dashboard.png) · [最终词库](imgs/final-library.png) · [居中编辑弹窗](imgs/final-centered-editor.png) · [平板](imgs/final-library-tablet.png) · [训练](imgs/stage7-dark-practice.png) · [结果](imgs/stage5-training-result.png) · [错误分析](imgs/error-analysis-after-desktop.png) · [移动端](imgs/error-analysis-after-mobile.png)

演示截图中的成绩由独立自动化训练流程生成，不是默认数据。部分历史截图保留旧品牌/旧说明，最新界面以最终版截图为准。

## 已知限制

- 浏览器需要 Intl.Segmenter、ResizeObserver、Canvas、Worker 等现代 Web API；未声明兼容旧版浏览器。自动化以 Chromium 为主，未完成 Firefox/Safari 全矩阵。
- 用户已确认第一至第八阶段的 Windows 人工验收；第九阶段云端运行的是 Linux Chromium，不能冒充新增 Windows 实机测试。
- 10 万字符上限样本可加载但明显卡顿：本次云端打开约 13.3 秒，输入更新约 0.8–1.15 秒。当前逐字符 DOM 渲染未虚拟化，建议拆成较短文章练习；这是实测限制，不承诺上限文本流畅。
- 500 条记录/500 个错误字符样本可正常展示；localStorage 容量与设备性能仍有限，不提供数据库级跨标签事务或云同步。
- 仅支持 TXT/DOCX 纯文本；不支持 DOC、OCR 或富文本编辑。GB18030 不能识别所有“解码合法但语义乱码”的内容，需要预览确认。
- 旧历史无逐字分析，跨午夜训练不分摊到多个日期；日期会随当前本地时区重新解释。

## 作业交付

压缩包已按 `week02/homework/typing/` 组织。该目录下的 README、src、dist、imgs、配置、锁文件和测试一并提交到**学校指定分支**；未指定时使用学校个人仓库的默认分支（可能是 main 或 master），不要用 gh-pages 代替源码作业分支。

不提交 node_modules、.git、缓存、测试报告或本地环境文件。学校仓库的其他目录保持不变。压缩包根目录“提交说明.md”用于操作参考，无需覆盖学校根 README。详细网页上传和 Git 步骤见 [提交指南](docs/SUBMISSION_GUIDE.md)。本次按用户要求只整理交付，不代为推送学校仓库。
