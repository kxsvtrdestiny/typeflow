# 学校作业提交指南

本次只整理最终文件，不代为提交学校仓库。请使用你在 hzau-2028-fullstack-tasks 组织下的个人仓库，不是 kxsvtrdestiny/typeflow 演示仓库。

## 压缩包里是什么

```text
提交说明.md
交付清单.json
Git提交记录.txt
week02/
  homework/
    typing/
      README.md
      DEVELOPMENT.md
      src/
      dist/
      imgs/
      public/
      tests/
      scripts/
      docs/
      package.json
      package-lock.json
      index.html
      .gitignore
      vite.config.ts
      tsconfig*.json
      playwright.config.ts
      vitest.config.ts
```

压缩包不包含 node_modules、.git、缓存、测试运行报告或个人环境变量。交付清单包含源码提交标识及每个归档文件的 SHA-256。压缩包内 Git 提交历史文本用于追溯，复制文件本身不会把演示仓库的 .git 元数据带入学校仓库。

## 哪些文件提交到哪个分支

所有项目源码、dist、imgs、README、锁文件、配置和测试都放在同一个学校作业分支的 `week02/homework/typing/`，不需要把 src 与 dist 分开提交。

1. 有老师规定的分支：严格使用规定分支。
2. 未规定：使用学校个人仓库网页默认选中的分支，通常 main，也可能 master；以实际仓库为准。
3. gh-pages 是演示网站的生产发布分支，不是本作业的源码提交位置。
4. 不另建、重命名或强制覆盖学校的默认分支。

## 方法一：GitHub 网页上传

1. 下载并解压交付包。
2. 打开学校组织下自己的仓库，选对上述分支。
3. 检查现有 `week02/homework/typing/`：若已有旧版，先下载备份并核对，只替换这个项目目录内的文件，不删除其他作业。
4. 可在仓库根通过 Add file → Upload files 拖入解压后的 week02 文件夹；务必在提交预览中确认新增/修改路径**全部以 week02/homework/typing/ 开头**。浏览器若不支持文件夹拖入，请用下述 Git 方法。
5. 如果网页已位于 week02/homework，不再拖入 week02 层，只拖入 typing 文件夹，避免路径重复。
   网页上传通常每批最多 100 个文件；本项目文件超过一批，建议优先用 Git。若分批上传，始终维持相同目录前缀，最后检查所有批次文件齐全，再交作业。
6. 检查隐藏的 .gitignore、public/.nojekyll、dist/.nojekyll 也包含在提交中。没有 node_modules；dist/assets 与 dist/index.html 均存在。
7. 不要把压缩包本身作为唯一作业文件上传，也不要用项目 README 覆盖学校仓库根 README。
8. 提交信息可用 `feat: submit week02 typing homework`。若组织要求 PR，选择创建分支并按老师流程提交 PR；否则按实际权限提交到要求的分支。
9. 提交后网页确认完整路径，检查最后提交和文件内容，保留提交链接供交作业。

## 方法二：本地 Git（推荐，上传目录更可靠）

终端中的尖括号是需要替换的占位符，不要原样执行。

```sh
git clone <学校个人仓库完整URL> school-work
cd school-work
git branch --show-current
```

如果当前分支不是学校要求的分支，再执行 `git switch <学校要求的分支>`。默认分支即为要求时不必切换。

将压缩包中的 week02/homework/typing 复制到这个克隆仓库的相同位置。仅处理 typing 目录，保留其他 week02 内容；若已存在，先备份再替换本项目目录内的旧版。不要使用会清空整个 week02 或仓库的镜像/清理命令。

```sh
git status --short
git add -- week02/homework/typing
git diff --cached --stat
git ls-files week02/homework/typing/node_modules
```

最后一条应无输出。预览改动仅属于 typing，确认 dist、src、imgs、README 和配置齐全后：

```sh
git commit -m "feat: submit week02 typing homework"
git push origin <学校要求的分支>
```

如果学校要求 PR，再按组织规则创建；推送被保护规则拒绝时不要强推，不删除其他文件来规避规则。若 node_modules 以前就被错误跟踪，.gitignore 不会自动取消跟踪，需要仅对 typing/node_modules 执行取消跟踪并再次检查；交付包本身不含此目录。

## 本地运行与自查

若只是查看生产页面，在解压目录内：

```sh
cd week02/homework/typing/dist
npx serve .
```

打开终端显示的网址，不双击 index.html。运行源码与全部检查时回到 typing：

```sh
npm ci
npm run dev
npm test
npm run typecheck
npx playwright install chromium
npm run test:e2e
npm run build
```

npm ci 生成的 node_modules 留在本地，不上传；构建后的 dist 仍需要提交。老师只需静态预览时，可直接使用已交付 dist。首次 npx serve 或 Playwright 安装需要网络。

提交前最后核对：路径无重复嵌套、分支正确、未动其他作业、没有 node_modules、dist 可运行、源码/锁文件/截图/测试齐全，网页最新提交可见。
