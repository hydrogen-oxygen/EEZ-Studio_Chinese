[![GitHub release](https://img.shields.io/github/release/eez-open/studio.svg)](https://github.com/eez-open/studio/releases) [![license](https://img.shields.io/github/license/eez-open/studio.svg)](https://github.com/eez-open/studio/blob/master/LICENSE.TXT) [![liberapay](https://img.shields.io/liberapay/receives/eez-open.svg?logo=liberapay)](https://liberapay.com/eez-open/donate) [![Downloads](https://img.shields.io/github/downloads/eez-open/studio/total)](https://github.com/eez-open/studio/releases)

### 技术支持

欢迎在 [Issues](https://github.com/eez-open/studio/issues) 部分提交您的意见、建议、新功能请求和错误报告。但请注意，Envox 团队将按照“尽力而为”原则处理所报告的问题，因此请相应调整您的期望。不过，如果您希望获得更及时、高质量的响应以及直接的技术支持联系，您可以选择我们的 [支持计划](https://www.envox.eu/support-plans/)（另请查看[此篇](https://www.envox.eu/premium-technical-support-for-eez-studio/)博客文章）。  
我们邀请您加入我们的 [Discord](https://discord.gg/q5KAeeenNG) 社区，在那里您可以从其他成员处获得一些问题的解答。您也可以在 [Discussions](https://github.com/eez-open/studio/discussions) 下发起讨论。

### 所有权与许可

贡献者列表见 CONTRIB.TXT。本项目使用 GPL v3 许可证，参见 LICENSE.TXT。
EEZ Studio 采用 [C4.1（集体代码建设契约）](http://rfc.zeromq.org/spec:22) 流程进行贡献。
若要报告问题，请使用 [EEZ Studio 问题跟踪器](https://github.com/eez-open/studio/issues)。

_重要提示：Envox d.o.o. 不对 `Build` 命令生成的源代码主张任何所有权，但使用 EEZ Flow 的项目除外，此时该代码基于 MIT 许可证授予。_  
_用户拥有 `.eez-project` 文件以及从 `eez-project` 文件中包含的文件模板定义生成的所有源代码。EEZ Studio 还可能生成基于 MIT、BSD 2.0 或公共域许可证的文件。_

### 链接

-   [网页](https://www.envox.eu/studio/studio-introduction/)
-   [FAQ](https://github.com/eez-open/studio/wiki/Q&A)
-   [Discord](https://discord.gg/q5KAeeenNG) 服务器
-   [X（推特）](https://twitter.com/envox)
-   [Mastodon](https://mastodon.social/@envox)
-   [YouTube](https://www.youtube.com/c/eezopen) 频道
-   [Liberapay](https://liberapay.com/eez-open/donate) 捐赠 <img src="https://liberapay.com/assets/liberapay/icon-v2_white-on-yellow.svg" width="16" />

## 简介

EEZ Studio 是一款免费开源的跨平台低代码可视化工具，用于桌面和嵌入式 GUI，支持 [LVGL](https://lvgl.io/)。内置的 _EEZ Flow_ 能够为测试与测量自动化创建复杂场景，而 Instruments 功能则提供对多种设备和 T&M 设备的远程控制，包括 [EEZ BB3](https://github.com/eez-open/modular-psu) T&M 机箱、[EEZ H24005](https://github.com/eez-open/psu-hw) 可编程电源，以及任何其他支持 [SCPI](https://www.ivifoundation.org/scpi/) 的 T&M 设备（来自 Keysight、Rigol、Siglent 等制造商）。

### EEZ Studio _项目_

![EEZ Studio 项目](docs/images/projects_intro.png)

-   模块化可视化开发环境，用于设计 TFT 显示屏的屏幕装饰和定义用户交互（嵌入式 GUI）
-   生成嵌入式 GUI 功能的 C++ 代码，可直接包含在 [STM32CubeIDE](https://www.st.com/en/development-tools/stm32cubeide.html)（用于 BB3 及其他 STM32 目标平台）或 [Arduino IDE](https://www.arduino.cc/en/software)（用于 H24005 及其他 Arduino 兼容目标平台）中
-   _仪器定义文件_（IDF）构建器，附带上下文相关的 SCPI 命令帮助（基于 Keysight 的 [Offline Command Expert 命令集](https://www.keysight.com/main/software.jspx?cc=US&lc=eng&ckey=2333687&nid=-11143.0.00&id=2333687) XML 结构），适用于 EEZ Studio _Instrument_ 和 [Keysight Command Expert](https://www.keysight.com/en/pd-2036130/command-expert)
-   SCPI 命令帮助生成器，基于从 .odt 文件使用 [EEZ WebPublish](https://github.com/eez-open/WebPublish) 扩展（用于 OpenOffice/LibreOffice）直接生成的带书签的 HTML
-   支持 [LVGL](https://lvgl.io/)（轻量通用图形库）8.x 和 9.x
-   项目模板（使用 giteo.io 仓库）和项目对比
-   拖放编辑器，用于创建仪器的桌面仪表板（用于远程控制和管理）
-   基于流程图的低代码编程，用于桌面仪表板

![流程](docs/images/flow_intro.png)

### EEZ Studio _仪器_

![EEZ Studio 仪器](docs/images/instruments_intro.png)

-   动态环境，可配置多个仪器并轻松访问
-   与每个 SCPI 仪器的会话导向交互
-   支持串口（通过 USB）、以太网和 VISA（通过免费的 [R&S®VISA](https://www.rohde-schwarz.com/us/driver-pages/remote-control/3-visa-and-tools_231388.html)）T&M 仪器接口
-   直接导入 EEZ Studio 生成的 IDF 和 **Keysight Offline Command Expert 命令集**
-   IEXT（仪器扩展）目录，包含越来越多受支持的仪器（Rigol、Siglent、Keysight 等）
-   所有活动的历史记录，支持搜索/内容过滤
-   通过日历（“热图”）或会话列表视图快速导航
-   快捷方式（热键和按钮），可由用户定义或从导入的 IDF 预定义。快捷方式可包含单个或一系列 SCPI 命令，或 Javascript 代码
-   用于任务自动化的 Javascript 代码（例如日志文件、编程列表上传/下载等）也可分配给快捷方式
-   SCPI 命令上下文相关帮助，支持搜索
-   文件上传（仪器到 PC），支持图像预览（例如屏幕截图）
-   文件下载（PC 到仪器）自动化，用于传输仪器配置文件
-   简易任意波形编辑器（包络和表格模式）
-   将测量数据显示为图形
-   FFT 分析、谐波和简单数学函数（周期、频率、最小值、最大值、峰峰值、平均值）
-   将图形导出为 .CSV 文件

---

## 安装

所有情况均需要 64 位操作系统。

### Linux

根据您的 Linux 发行版，选择列出的软件包之一（.deb、.rpm），并使用相应的安装程序开始安装。
此外，还有自执行的 .AppImage 版本，下载后需要在文件“权限”中启用“允许作为程序执行文件”，然后启动。
如果在您的 Linux 发行版上运行 .AppImage 版本时遇到问题，请尝试使用 `--no-sandbox` 选项运行，即 `./EEZ-Studio-[version].AppImage --no-sandbox`

### Mac

根据您的偏好，选择以下安装方法之一：

**Homebrew**

如果您已安装 [Homebrew](https://brew.sh)，则可以使用以下命令安装 EEZ Studio：

```
brew install --cask eez-studio
```

**手动安装**

下载 `eezstudio-mac.zip`，解压并将 `eezstudio.app` 移动到 Applications 文件夹。

### Windows

下载并启动 `EEZ_Studio_setup.exe`。

### Nix

**注意：** Nix 打包当前已损坏（参见 [#940](https://github.com/eez-open/studio/issues/940)）。欢迎社区贡献。

Nix flake 提供了 EEZ Studio 的派生或提供该派生的 overlay。它可用于通过 [Nix 包管理器](https://nixos.org/) 安装该项目。

### 从源代码构建并运行（所有操作系统）

-   安装 `Node.JS 16.x` 或更新版本
-   安装 `node-gyp`，更多信息请参见 https://github.com/nodejs/node-gyp#installation

#### 仅 Linux：

```
sudo apt-get install build-essential libudev-dev libnss3
```

#### 仅 Raspbian：

在 Raspberry Pi 上安装 Node.js 16 和 npm：https://lindevs.com/install-node-js-and-npm-on-raspberry-pi/

```
sudo apt-get install build-essential libudev-dev libopenjp2-tools ruby-full
sudo gem install fpm
```

#### 所有平台：

```
git clone https://github.com/eez-open/studio
cd studio
npm install
npm run build
```

使用以下命令启动：

```
npm start
```

创建分发包（除 MacOS 和 Raspbian 外）：

```
npm run dist
```

在 MacOS 上：

```
npm run dist-mac-arm64
```

或

```
npm run dist-mac-x64
```

在 Raspbian 上：

```
npm run dist-raspbian
```

#### Nix

构建：

```
nix build 'github:eez-open/studio'
```

启动：

```
nix run 'github:eez-open/studio'
```

## USB TMC

如果您希望从 EEZ Studio _Instrument_ 部分通过 USB-TMC 接口访问 T&M 仪器，则必须安装 USB TMC 驱动程序。

### Windows

下载并启动 [Zadig](http://zadig.akeo.ie/)。选择您的设备，选择 libusb-win32，然后按下“Replace Driver”按钮：

![Zadig](docs/images/usbtmc_zadin_windows.png)

### Linux

您可能需要将您的 Linux 账户添加到 usbtmc 组，然后才能使用 EEZ Studio 访问仪器。通过 USB 线连接您的仪器并开机。等待启动完成。现在通过输入以下命令检查仪器组名称：

```
ls -l /dev/usbtmc*
```

如果显示为 root，请输入命令：

```
sudo groupadd usbtmc
```

现在，将您的账户（<用户名>）添加到组中：

```
sudo usermod -a -G usbtmc <用户名>
```

需要重启。之后，`/dev/usbtmc0` 的 gid 应设置为 `usbtmc`，您就可以通过 USB-TMC 接口使用您的仪器了。

## FAQ

[FAQ Wiki](https://github.com/eez-open/studio/wiki/FAQ)

**问**：数据库文件默认在哪里？
**答**：取决于操作系统，可能在：

-   Linux：`~/.config/eezstudio/storage.db`
-   Mac：`~/Library/Application\ Support/eezstudio/storage.db`
-   Windows：`%appdata%\eezstudio\storage.db`

默认创建的数据库及其位置可以在 EEZ Studio 的 _Settings_ 部分通过选项进行更改。

**问**：用于访问 T&M 仪器的 IEXT（仪器扩展）存储在哪里？
**答**：取决于操作系统，可能在：

-   Linux：`~/.config/eezstudio/extensions`
-   Mac：`~/Library/Application\ Support/eezstudio/extensions`
-   Windows：`%appdata%\eezstudio\extensions`

---

本工作由 [NLnet](https://nlnet.nl/project/BB3-CM5/) 基金会资助

![nlnet](docs/images/nlnet-logo.png)