---
title: JMeter 快速入门
date: 2026-10-05 10:00:00
updated: 2026-10-05 10:00:00
description: 从零掌握 Apache JMeter：环境搭建、核心元件结构、第一个 HTTP 压测脚本、参数化与关联、断言校验、命令行压测与 HTML 报告生成。
categories:
  - 测试工具
tags:
  - JMeter
  - 性能测试
  - 压测
cover: /img/banner2.jpg
---

JMeter 是性能测试领域最常用的开源工具之一。这篇文章从安装讲起，带你走完「写脚本 → 参数化 → 关联 → 断言 → 命令行压测 → 看报告」的完整流程，看完即可上手做一次接口压测。

<!-- more -->

## 一、JMeter 是什么

Apache JMeter 是 Apache 基金会旗下的开源性能测试工具，纯 Java 编写，跨平台运行。它最初用于 Web 应用压测，如今已覆盖 HTTP/HTTPS、JDBC 数据库、FTP、JMS、SOAP/REST、TCP 等多种协议。

它的核心思路是「**用线程模拟并发用户，用取样器发起请求，用监听器收集结果**」。一套测试计划（Test Plan）就是一棵元件树，GUI 用来编写和调试脚本，真正的压测则交给命令行执行。

常见用途：

- 接口压测：测出接口的吞吐量与响应时间
- 性能基准：版本迭代前后做对比
- 稳定性/疲劳测试：长时间运行观察内存与错误率
- 功能回归：配合断言校验接口返回是否正确

## 二、安装与启动

**前置条件**：JDK 8 及以上（推荐 JDK 8 / 11 / 17），并正确配置 `JAVA_HOME`。

1. 打开官网 [jmeter.apache.org/download_jmeter.cgi](https://jmeter.apache.org/download_jmeter.cgi)，下载 **Binary** 版压缩包，例如 `apache-jmeter-5.6.3.zip`
2. 解压到**无中文、无空格**的目录，例如 `D:\tools\apache-jmeter-5.6.3`
3. （可选）配置环境变量 `JMETER_HOME`，并把 `%JMETER_HOME%\bin` 加入 `PATH`
4. 启动图形界面：Windows 双击 `bin\jmeter.bat`，macOS / Linux 执行 `bin/jmeter`

解压后的主要目录：

| 目录 | 说明 |
| --- | --- |
| `bin` | 启动脚本、核心配置 `jmeter.properties` |
| `lib` | 核心依赖 jar 包 |
| `lib/ext` | 扩展与插件 jar 包 |
| `docs` | 官方文档与 API 说明 |

> 提示：GUI 仅用于**编写和调试**脚本。真正施压时务必使用命令行模式，GUI 本身会占用大量资源并影响结果准确性（见第八节）。

## 三、核心概念与元件结构

JMeter 的脚本是一棵**树**，理解层级关系是用好它的前提：

```text
测试计划 (Test Plan)
└── 线程组 (Thread Group)        —— 模拟多少用户、多久、循环几次
    ├── 配置元件 (Config Element) —— HTTP 请求默认值、CSV 数据文件…
    ├── 前置处理器 (Pre Processor)
    ├── 取样器 (Sampler)          —— 真正发起请求，如 HTTP Request
    ├── 后置处理器 (Post Processor)—— 提取响应数据，如 JSON 提取器
    ├── 断言 (Assertion)          —— 校验响应是否正确
    └── 监听器 (Listener)         —— 收集并展示结果
```

同一个作用域内的**执行顺序**固定为：

```text
配置元件 → 前置处理器 → 取样器 → 后置处理器 → 断言 → 监听器
```

线程组的关键参数：

| 参数 | 含义 |
| --- | --- |
| 线程数 (Number of Threads) | 并发用户数 |
| Ramp-Up 时间 | 多少秒内把线程全部启动完 |
| 循环次数 | 每个线程执行几轮 |
| 持续时间 | 勾选调度器后，压测持续多久 |

举例：线程数 10、Ramp-Up 5、循环 5，表示 5 秒内启动 10 个用户，每个用户执行 5 轮请求，总请求量为 10 × 5 = 50 次。

## 四、第一个压测：压测一个 HTTP 接口

目标：对 `https://httpbin.org/get` 发起 50 次请求。

**步骤**

1. 新建测试计划，右键 → 添加 → 线程组
2. 设置线程组：线程数 `10`，Ramp-Up `5`，循环次数 `5`
3. 右键线程组 → 添加 → 取样器 → **HTTP 请求**，填写：
   - 协议：`https`
   - 服务器名称或 IP：`httpbin.org`
   - 方法：`GET`
   - 路径：`/get`
4. 右键线程组 → 添加 → 监听器 → **查看结果树**、**聚合报告**
5. 点击工具栏绿色启动按钮，运行后在两个监听器中查看结果

**聚合报告字段解读**

| 字段 | 含义 |
| --- | --- |
| Samples | 请求总数 |
| Average | 平均响应时间（ms） |
| Median | 中位数响应时间 |
| 90% Line | 90% 的请求耗时低于该值 |
| Min / Max | 最小 / 最大响应时间 |
| Error % | 错误率 |
| Throughput | 吞吐量（请求 / 秒） |

> 关注 **90% / 95% 分位**比关注平均值更有意义——平均值会掩盖长尾请求，而用户体验恰恰由长尾决定。

## 五、参数化：用不同账号模拟真实用户

压测登录这类接口时，如果所有线程用同一个账号，很容易被服务端拦截，也无法模拟真实场景。此时使用 **CSV Data Set Config**。

1. 准备 `data.csv`：

```csv
username,password
user1,pass1
user2,pass2
user3,pass3
```

2. 线程组 → 添加 → 配置元件 → **CSV Data Set Config**，配置：
   - Filename：`data.csv`（绝对路径更稳妥）
   - Variable Names：`username,password`
   - Delimiter：`,`
   - Recycle on EOF：`True`（文件读完后循环读取）
   - Sharing mode：`All threads`
3. 在 HTTP 请求的参数值中通过 `${username}`、`${password}` 引用即可。

## 六、关联：提取响应数据供后续接口使用

很多接口依赖上一个接口的返回，例如「先登录拿 token，再带 token 查数据」。这就需要**提取响应内容并保存为变量**。

以 JSON 响应为例，加入 **JSON Extractor**（右键取样器 → 添加 → 后置处理器 → JSON Extractor）：

| 配置项 | 值 |
| --- | --- |
| Names of created variables | `token` |
| JSON Path expressions | `$.data.token` |
| Match No. | `1` |

若响应不是标准 JSON，可用**正则表达式提取器**：

| 配置项 | 值 |
| --- | --- |
| Reference Name | `token` |
| Regular Expression | `"token":"(.+?)"` |
| Template | `$1$` |

提取完成后，在后续请求中用 `${token}` 引用即可。

## 七、断言：确认结果真的正确

只发请求不校验，即使服务返回 500 也会被当作成功。断言负责把关。

- **响应断言**：右键取样器 → 添加 → 断言 → 响应断言
  - 测试字段：`响应文本`（或 `响应代码`）
  - 模式匹配规则：`包含`
  - 测试模式：填期望出现的内容，如 `"success": true`
- **响应时间断言**：校验单次请求耗时不超过阈值，例如 `500` ms
- **JSON 断言**：直接校验 JSON 中某字段的取值

断言失败时，请求会在结果树中**标红**，并计入错误率，避免"假成功"。

## 八、命令行压测与 HTML 报告

真正的压测请使用**非 GUI 模式**（Non-GUI Mode），它资源占用低、结果更准确。

```bash
# 在 JMeter 的 bin 目录下执行
jmeter -n -t test.jmx -l result.jtl -e -o report
```

参数含义：

| 参数 | 含义 |
| --- | --- |
| `-n` | 非 GUI 模式运行 |
| `-t` | 指定测试计划 `.jmx` 文件 |
| `-l` | 结果数据文件 `.jtl` |
| `-e` | 压测结束后生成 HTML 报告 |
| `-o` | HTML 报告输出目录（**必须为空目录**） |

执行完成后打开 `report/index.html`，即可看到 TPS 曲线、响应时间分布、错误率等图表。

如果压测时没生成报告，也可以事后用已有结果文件补生成：

```bash
jmeter -g result.jtl -o report
```

## 九、最佳实践与常见坑

- **压测用命令行，GUI 只写脚本**，否则 GUI 自身成为性能瓶颈。
- **压测机与被测服务分离**，避免互相争抢 CPU / 内存 / 带宽。
- **精简监听器**：`查看结果树`、`聚合报告` 都很吃内存，压测时建议只留必要的，或改为写 `.jtl` 后离线分析。
- **必加断言**，否则错误请求会被当作成功，错误率失真。
- **加 Cookie 管理器 / 缓存管理器**：模拟浏览器真实行为，也要注意缓存对压测结果的干扰。
- **调整 JVM 堆内存**：修改 `bin/jmeter.bat`（或 `jmeter`）中的 `HEAP` 配置，默认 1G，大规模压测需适当上调。
- **突破单机并发上限**：使用分布式压测，主控机配置 `remote_hosts`，各执行机启动 `jmeter-server`。
- **多看分位值**：90% / 95% / 99% Line 比 Average 更能反映真实体验。

## 十、小结

一次完整的 JMeter 压测流程可以概括为：

```text
安装 JDK + JMeter
   → 新建线程组（定并发与时长）
   → 添加 HTTP 取样器（发请求）
   → 参数化（CSV）+ 关联（提取器）+ 断言（校验）
   → 保存为 .jmx
   → 命令行非 GUI 施压
   → 查看 HTML 报告，分析 TPS / 响应时间 / 错误率
```

掌握这套结构后，面对大多数接口压测场景都可以快速搭建脚本。下一步可以深入研究分布式压测、自定义 Java 取样器以及 CI 中的自动化性能回归。
