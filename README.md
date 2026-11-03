# 精简版作业提交指南

本下载版只保留老师需要的项目文件。imgs 仅有最新首页和词库管理截图两张，不含修改前截图、旧品牌截图、重复阶段报告、node_modules 或测试缓存。

## 下载后提交哪一层

下载 school-submission 分支的 ZIP，解压后：

```text
typeflow-school-submission/
├── README.md                    ← 本提交指南，供你阅读
└── week02/homework/typing/      ← 完整作业项目
    ├── README.md                ← 老师阅读的项目说明
    ├── DEVELOPMENT.md
    ├── src/、dist/、imgs/、public/
    ├── tests/、scripts/、docs/
    ├── package.json、package-lock.json
    └── .gitignore、.nvmrc 及必要配置
```

将 week02/homework/typing 复制到学校个人仓库的相同路径。不要额外套一层 typing，不要用外层 README 覆盖学校仓库根 README。如果学校已有旧版 typing，先备份再只替换该 typing 目录，避免旧截图残留；其他作业不动。

## 哪个仓库、哪个分支

- 学校仓库：hzau-2028-fullstack-tasks 组织下你自己的个人仓库。
- 老师指定分支优先；没有指定时用学校仓库默认分支，通常 main，也可能 master，以实际页面为准。
- school-submission 只是本下载来源的分支名，不要求在学校仓库建同名分支。
- 不使用 gh-pages 代替源码作业分支。src、dist、imgs、README、配置、锁文件和测试全部提交到同一个作业分支。
- 没有代你推送学校仓库，需自行提交。

## 推荐：本地 Git 上传

尖括号里的内容换成你的实际地址/分支：

```sh
git clone <学校个人仓库URL> school-work
cd school-work
git branch --show-current
```

如果不是学校要求分支，再执行 git switch <要求分支>。然后把本包的 week02/homework/typing 复制到同名位置，保留其他作业。

```sh
git status --short
git add -- week02/homework/typing
git diff --cached --stat
git ls-files week02/homework/typing/node_modules
```

最后一条应无输出。确认改动只在 typing 内，dist、imgs、src 和配置完整，再提交：

```sh
git commit -m "feat: submit week02 typing homework"
git push origin <学校要求的分支>
```

若学校要求 PR，按组织规定提 PR；不要强推或清空其他目录。

## GitHub 网页上传

进入学校仓库并选择要求分支，通过 Add file → Upload files 拖入本包里的 week02 文件夹。预览中全部修改路径应以 week02/homework/typing/ 开头；若网页已在 week02/homework，则只拖入 typing。

网页上传通常每批最多100个文件，文件多时请分批保持路径一致，或优先使用 Git。不要只上传 ZIP。保留 .gitignore、public/.nojekyll 和 dist/.nojekyll；最后检查所有批次齐全并保存提交链接。只清理 typing 内的旧版，不删除其他作业。

## 本地查看与自查

直接查看已构建页面：

```sh
cd week02/homework/typing/dist
npx serve .
```

用浏览器打开终端显示的 HTTP 地址，不双击 index.html。运行源码时进入 typing 目录：

```sh
npm ci
npm run dev
```

检查和构建：

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run build
```

最低 Node.js 22.12，推荐24。首次安装需要网络。node_modules 只留本地，不上传；dist 必须保留。项目说明见 typing/README.md，最终验收清单见 typing/docs/FINAL_ACCEPTANCE.md。
