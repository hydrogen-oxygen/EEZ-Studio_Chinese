import os from "os";
import fs from "fs";
import {
    app,
    dialog,
    Menu,
    ipcMain,
    BrowserWindow,
    BaseWindow
} from "electron";
import { autorun, runInAction } from "mobx";

import {
    importInstrumentDefinitionFile,
    openHomeWindow
} from "main/home-window";
import {
    IWindow,
    setForceQuit,
    windows,
    findWindowByBrowserWindow,
    isCrashed
} from "main/window";
import { settings } from "main/settings";
import { APP_NAME } from "main/util";
import { undoManager } from "eez-studio-shared/store";
import { isDev } from "eez-studio-shared/util-electron";

////////////////////////////////////////////////////////////////////////////////

function showAboutBox(item: any, focusedWindow: any) {
    if (focusedWindow) {
        focusedWindow.webContents.send("show-about-box");
    }
}

function isMacOs() {
    return os.platform() === "darwin";
}

function enableMenuItem(
    menuItems: Electron.MenuItemConstructorOptions[],
    id: string,
    enabled: boolean
) {
    for (let i = 0; i < menuItems.length; i++) {
        if (menuItems[i].id === id) {
            menuItems[i].enabled = enabled;
            return;
        }
    }
}

async function openProjectWithFileDialog(focusedWindow: BaseWindow) {
    const result = await dialog.showOpenDialog(focusedWindow, {
        properties: ["openFile"],
        filters: [
            { name: "EEZ 项目", extensions: ["eez-project"] },
            {
                name: "EEZ 仪表盘",
                extensions: ["eez-dashboard"]
            },
            { name: "所有文件", extensions: ["*"] }
        ]
    });
    const filePaths = result.filePaths;
    if (filePaths && filePaths[0]) {
        openFile(filePaths[0], focusedWindow, false);
    }
}

export function openFile(
    filePath: string,
    focusedWindow?: any,
    runMode?: boolean
) {
    if (
        filePath.toLowerCase().endsWith(".eez-project") ||
        filePath.toLowerCase().endsWith(".eez-dashboard")
    ) {
        if (!focusedWindow) {
            focusedWindow = BrowserWindow.getFocusedWindow() || undefined;
        }

        if (focusedWindow) {
            focusedWindow.webContents.send("open-project", filePath, runMode);
        }
    }
}

export function loadDebugInfo(debugInfoFilePath: string, focusedWindow?: any) {
    if (!focusedWindow) {
        focusedWindow = BrowserWindow.getFocusedWindow();
    }

    if (focusedWindow) {
        focusedWindow.webContents.send("load-debug-info", debugInfoFilePath);
    }
}

export function saveDebugInfo(focusedWindow?: any) {
    if (!focusedWindow) {
        focusedWindow = BrowserWindow.getFocusedWindow();
    }

    if (focusedWindow) {
        focusedWindow.webContents.send("save-debug-info");
    }
}

function createNewProject() {
    BrowserWindow.getFocusedWindow()!.webContents.send("new-project");
}

function addInstrument() {
    BrowserWindow.getFocusedWindow()!.webContents.send("add-instrument");
}

////////////////////////////////////////////////////////////////////////////////

function buildMacOSAppMenu(
    win: IWindow | undefined
): Electron.MenuItemConstructorOptions {
    return {
        label: APP_NAME,
        submenu: [
            {
                label: "关于 " + APP_NAME,
                click: showAboutBox
            },
            {
                type: "separator"
            },
            {
                label: "服务",
                role: "services",
                submenu: []
            },
            {
                type: "separator"
            },
            {
                label: "隐藏 " + APP_NAME,
                accelerator: "Command+H",
                role: "hide"
            },
            {
                label: "隐藏其他",
                accelerator: "Command+Alt+H",
                role: "hideOthers"
            },
            {
                label: "显示全部",
                role: "unhide"
            },
            {
                type: "separator"
            },
            {
                label: "退出",
                accelerator: "Command+Q",
                click: function () {
                    setForceQuit();
                    app.quit();
                }
            }
        ]
    };
}

////////////////////////////////////////////////////////////////////////////////

function buildFileMenu(win: IWindow | undefined) {
    const fileMenuSubmenu: Electron.MenuItemConstructorOptions[] = [];

    fileMenuSubmenu.push(
        {
            label: "新建项目...",
            accelerator: "CmdOrCtrl+N",
            click: function (item, focusedWindow) {
                createNewProject();
            }
        },
        {
            label: "添加仪器...",
            accelerator: "CmdOrCtrl+Alt+N",
            click: function (item, focusedWindow) {
                addInstrument();
            }
        },
        {
            label: "新建窗口",
            accelerator: "CmdOrCtrl+Shift+N",
            click: function (item, focusedWindow) {
                openHomeWindow();
            }
        },
        {
            type: "separator"
        },
        {
            label: "打开...",
            accelerator: "CmdOrCtrl+O",
            click: (item, focusedWindow) => {
                if (!focusedWindow) {
                    focusedWindow =
                        BrowserWindow.getFocusedWindow() || undefined;
                }

                if (focusedWindow) {
                    openProjectWithFileDialog(focusedWindow);
                }
            }
        },
        {
            label: "最近打开",
            submenu: settings.mru.map(mru => ({
                label: mru.filePath,
                click: function () {
                    if (fs.existsSync(mru.filePath)) {
                        openFile(mru.filePath);
                    } else {
                        // 文件不存在，从最近列表中移除
                        var i = settings.mru.indexOf(mru);
                        if (i != -1) {
                            runInAction(() => {
                                settings.mru.splice(i, 1);
                            });
                        }

                        // 通知用户
                        dialog.showMessageBox(
                            BrowserWindow.getFocusedWindow()!,
                            {
                                type: "error",
                                title: "EEZ Studio",
                                message: "文件不存在。",
                                detail: `文件 '${mru.filePath}' 似乎已不存在。`
                            }
                        );
                    }
                }
            }))
        }
    );

    if (
        win?.activeTabType === "project" ||
        win?.activeTabType === "run-project"
    ) {
        fileMenuSubmenu.push(
            {
                type: "separator"
            },
            {
                label: "重新加载项目",
                click: function (item: any, focusedWindow: any) {
                    focusedWindow.webContents.send("reload-project");
                }
            }
        );

        fileMenuSubmenu.push(
            {
                type: "separator"
            },
            {
                label: "加载调试信息...",
                click: async function (item: any, focusedWindow: any) {
                    const result = await dialog.showOpenDialog(focusedWindow, {
                        properties: ["openFile"],
                        filters: [
                            {
                                name: "EEZ 调试信息",
                                extensions: ["eez-debug-info"]
                            },
                            {
                                name: "EEZ 调试信息",
                                extensions: ["eez-debug-info"]
                            },
                            { name: "所有文件", extensions: ["*"] }
                        ]
                    });
                    const filePaths = result.filePaths;
                    if (filePaths && filePaths[0]) {
                        loadDebugInfo(filePaths[0], focusedWindow);
                    }
                }
            }
        );

        if (win.state.isDebuggerActive) {
            fileMenuSubmenu.push({
                label: "保存调试信息...",
                click: function (item: any, focusedWindow: any) {
                    saveDebugInfo(focusedWindow);
                }
            });
        }
    }

    fileMenuSubmenu.push(
        {
            type: "separator"
        },
        {
            label: "导入仪器定义...",
            click: async function (item: any, focusedWindow: any) {
                const result = await dialog.showOpenDialog(focusedWindow, {
                    properties: ["openFile"],
                    filters: [
                        {
                            name: "仪器定义文件",
                            extensions: ["zip"]
                        },
                        { name: "所有文件", extensions: ["*"] }
                    ]
                });
                const filePaths = result.filePaths;
                if (filePaths && filePaths[0]) {
                    importInstrumentDefinitionFile(filePaths[0]);
                }
            }
        }
    );

    if (win?.activeTabType === "project") {
        fileMenuSubmenu.push(
            {
                type: "separator"
            },
            {
                id: "save",
                label: "保存",
                accelerator: "CmdOrCtrl+S",
                click: function (item: any, focusedWindow: any) {
                    if (focusedWindow) {
                        focusedWindow.webContents.send("save");
                    }
                }
            },
            {
                label: "另存为",
                accelerator: "CmdOrCtrl+Shift+S",
                click: function (item: any, focusedWindow: any) {
                    if (focusedWindow) {
                        focusedWindow.webContents.send("saveAs");
                    }
                }
            },

            {
                type: "separator"
            },
            {
                label: "检查",
                accelerator: "CmdOrCtrl+K",
                click: function (item: any, focusedWindow: any) {
                    if (focusedWindow) {
                        focusedWindow.webContents.send("check");
                    }
                }
            },
            {
                label: "构建",
                accelerator: "CmdOrCtrl+B",
                click: function (item: any, focusedWindow: any) {
                    if (focusedWindow) {
                        focusedWindow.webContents.send("build");
                    }
                }
            }
        );

        if (win.state.hasExtensionDefinitions) {
            fileMenuSubmenu.push(
                {
                    label: "构建扩展",
                    click: function (item: any, focusedWindow: any) {
                        if (focusedWindow) {
                            focusedWindow.webContents.send("build-extensions");
                        }
                    }
                },
                {
                    label: "构建并安装扩展",
                    click: function (item: any, focusedWindow: any) {
                        if (focusedWindow) {
                            focusedWindow.webContents.send(
                                "build-and-install-extensions"
                            );
                        }
                    }
                }
            );
        }
    } else if (win?.activeTabType === "instrument") {
        fileMenuSubmenu.push(
            {
                type: "separator"
            },
            {
                id: "save",
                label: "保存",
                accelerator: "CmdOrCtrl+S",
                click: function (item: any, focusedWindow: any) {
                    if (focusedWindow) {
                        focusedWindow.webContents.send("save");
                    }
                }
            }
        );
    }

    let count = BrowserWindow.getAllWindows().filter(b => {
        return b.isVisible();
    }).length;
    if (count > 1) {
        fileMenuSubmenu.push(
            {
                type: "separator"
            },
            {
                label: "关闭窗口",
                accelerator: "CmdOrCtrl+W",
                click: function (item: any, focusedWindow: any) {
                    if (focusedWindow) {
                        if (isCrashed(focusedWindow)) {
                            app.exit();
                        } else {
                            focusedWindow.webContents.send("beforeClose");
                        }
                    }
                }
            }
        );
    }

    if (!isMacOs()) {
        fileMenuSubmenu.push(
            {
                type: "separator"
            },
            {
                label: "退出",
                click: function (item: any, focusedWindow: any) {
                    if (isCrashed(focusedWindow)) {
                        app.exit();
                    } else {
                        setForceQuit();
                        app.quit();
                    }
                }
            }
        );
    }

    return {
        label: "文件",
        submenu: fileMenuSubmenu
    };
}

////////////////////////////////////////////////////////////////////////////////

function buildEditMenu(win: IWindow | undefined) {
    const editSubmenu: Electron.MenuItemConstructorOptions[] = [
        {
            id: "undo",
            label: "撤销",
            accelerator: "CmdOrCtrl+Z",
            role: "undo",
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    const win = findWindowByBrowserWindow(focusedWindow);
                    if (win !== undefined && win.state.undo != null) {
                        win.browserWindow.webContents.send("undo");
                        return;
                    }
                }

                undoManager.undo();
            }
        },
        {
            id: "redo",
            label: "重做",
            accelerator: "CmdOrCtrl+Y",
            role: "redo",
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    const win = findWindowByBrowserWindow(focusedWindow);
                    if (win !== undefined && win.state.redo != null) {
                        win.browserWindow.webContents.send("redo");
                        return;
                    }
                }

                undoManager.redo();
            }
        },
        {
            type: "separator"
        },
        {
            label: "剪切",
            accelerator: "CmdOrCtrl+X",
            role: "cut",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("cut");
                }
            }
        },
        {
            label: "复制",
            accelerator: "CmdOrCtrl+C",
            role: "copy",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("copy");
                }
            }
        },
        {
            label: "粘贴",
            accelerator: "CmdOrCtrl+V",
            role: "paste",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("paste");
                }
            }
        },
        {
            label: "删除",
            accelerator: "Delete",
            role: "delete",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("delete");
                }
            }
        },
        {
            type: "separator"
        },
        {
            label: "全选",
            accelerator: "CmdOrCtrl+A",
            role: "selectAll",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("select-all");
                }
            }
        }
    ];

    if (win?.activeTabType === "project") {
        editSubmenu.push({
            type: "separator"
        });
        editSubmenu.push({
            label: "查找项目组件",
            accelerator: "CmdOrCtrl+Shift+F",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("findProjectComponent");
                }
            }
        });
    }

    const editMenu: Electron.MenuItemConstructorOptions = {
        label: "编辑",
        submenu: editSubmenu
    };

    enableMenuItem(
        <Electron.MenuItemConstructorOptions[]>editMenu.submenu,
        "undo",
        win !== undefined && win.state.undo != null
            ? !!win.state.undo
            : undoManager.canUndo
    );

    enableMenuItem(
        <Electron.MenuItemConstructorOptions[]>editMenu.submenu,
        "redo",
        win !== undefined && win.state.redo != null
            ? !!win.state.redo
            : undoManager.canRedo
    );

    return editMenu;
}

////////////////////////////////////////////////////////////////////////////////

function buildViewMenu(win: IWindow | undefined) {
    let viewSubmenu: Electron.MenuItemConstructorOptions[] = [];

    viewSubmenu.push(
        {
            label: "主页",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("openTab", "home");
                }
            }
        },
        {
            label: "历史",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("openTab", "history");
                }
            }
        },
        {
            label: "快捷方式和分组",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send(
                        "openTab",
                        "shortcutsAndGroups"
                    );
                }
            }
        },
        {
            label: "笔记本",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send(
                        "openTab",
                        "homeSection_notebooks"
                    );
                }
            }
        },
        {
            label: "扩展",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("openTab", "extensions");
                }
            }
        },
        {
            label: "设置",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("openTab", "settings");
                }
            }
        },
        {
            type: "separator"
        },
        {
            label: "项目编辑器的剪贴簿",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("showScrapbookManager");
                }
            }
        },
        {
            type: "separator"
        }
    );

    viewSubmenu.push(
        {
            label: "切换全屏",
            accelerator: (function () {
                if (isMacOs()) {
                    return "Ctrl+Command+F";
                } else {
                    return "F11";
                }
            })(),
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                }
            }
        },
        {
            label: "切换开发者工具",
            accelerator: (function () {
                if (isMacOs()) {
                    return "Alt+Command+I";
                } else {
                    return "Ctrl+Shift+I";
                }
            })(),
            click: function (item, focusedWindow: any) {
                if (focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            }
        },
        {
            label: settings.isDarkTheme
                ? "切换为浅色主题"
                : "切换为深色主题",
            accelerator: (function () {
                if (isMacOs()) {
                    return "Alt+Command+T";
                } else {
                    return "Ctrl+Shift+T";
                }
            })(),
            click: function (item, focusedWindow: any) {
                if (focusedWindow) {
                    focusedWindow.webContents.send("switch-theme");
                }
            }
        },
        {
            type: "separator"
        },
        {
            label: "放大",
            role: "zoomIn"
        },
        {
            label: "缩小",
            role: "zoomOut"
        },
        {
            label: "重置缩放",
            role: "resetZoom"
        },
        {
            type: "separator"
        }
    );

    if (win?.activeTabType === "project") {
        viewSubmenu.push({
            type: "separator"
        });

        viewSubmenu.push({
            label: settings.showComponentsPaletteInProjectEditor
                ? "隐藏组件面板"
                : "显示组件面板",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send(
                        "toggleComponentsPalette"
                    );
                }
            }
        });

        viewSubmenu.push({
            label: "重置布局",
            click: function (item) {
                if (win) {
                    win.browserWindow.webContents.send("resetLayoutModels");
                }
            }
        });

        viewSubmenu.push({
            type: "separator"
        });
    }

    viewSubmenu.push({
        label: "下一个标签页",
        accelerator: "Ctrl+Tab",
        click: function (item) {
            if (win) {
                win.browserWindow.webContents.send("show-next-tab");
            }
        }
    });

    viewSubmenu.push({
        label: "上一个标签页",
        accelerator: "Ctrl+Shift+Tab",
        click: function (item) {
            if (win) {
                win.browserWindow.webContents.send("show-previous-tab");
            }
        }
    });

    viewSubmenu.push({
        type: "separator"
    });

    viewSubmenu.push({
        label: "重新加载",
        accelerator: "CmdOrCtrl+R",
        click: function (item) {
            if (win) {
                win.browserWindow.webContents.send("reload");
                //focusedWindow.webContents.reload();
                //focusedWindow.webContents.clearHistory();
            }
        }
    });

    return {
        label: "视图",
        submenu: viewSubmenu
    };
}

////////////////////////////////////////////////////////////////////////////////

function buildMacOSWindowMenu(
    win: IWindow | undefined
): Electron.MenuItemConstructorOptions {
    return {
        label: "窗口",
        role: "window",
        submenu: [
            {
                label: "最小化",
                accelerator: "CmdOrCtrl+M",
                role: "minimize"
            },
            {
                label: "关闭",
                accelerator: "CmdOrCtrl+W",
                role: "close"
            },
            {
                type: "separator"
            },
            {
                label: "将所有窗口置于最前",
                role: "front"
            }
        ]
    };
}

////////////////////////////////////////////////////////////////////////////////

function buildHelpMenu(
    win: IWindow | undefined
): Electron.MenuItemConstructorOptions {
    const helpMenuSubmenu: Electron.MenuItemConstructorOptions[] = [];

    if (isDev) {
        helpMenuSubmenu.push({
            label: "文档",
            accelerator: "F1",
            click: function (item: any, focusedWindow: any) {
                focusedWindow.webContents.send("show-documentation-browser");
            }
        });
        helpMenuSubmenu.push({
            type: "separator"
        });
    }

    helpMenuSubmenu.push({
        label: "关于",
        click: showAboutBox
    });

    return {
        label: "帮助",
        role: "help",
        submenu: helpMenuSubmenu
    };
}

////////////////////////////////////////////////////////////////////////////////

function buildMenuTemplate(win: IWindow | undefined) {
    var menuTemplate: Electron.MenuItemConstructorOptions[] = [];

    if (isMacOs()) {
        menuTemplate.push(buildMacOSAppMenu(win));
    }

    menuTemplate.push(buildFileMenu(win));

    menuTemplate.push(buildEditMenu(win));

    menuTemplate.push(buildViewMenu(win));

    if (isMacOs()) {
        menuTemplate.push(buildMacOSWindowMenu(win));
    } else {
        menuTemplate.push(buildHelpMenu(win));
    }

    return menuTemplate;
}

////////////////////////////////////////////////////////////////////////////////

autorun(() => {
    for (let i = 0; i < windows.length; i++) {
        const win = windows[i];
        if (win.focused) {
            let menuTemplate = buildMenuTemplate(win);
            let menu = Menu.buildFromTemplate(menuTemplate);
            Menu.setApplicationMenu(menu);
        }
    }
});

////////////////////////////////////////////////////////////////////////////////

ipcMain.on("getReservedKeybindings", function (event: any) {
    const menuTemplate = buildMenuTemplate(undefined);

    let keybindings: string[] = [];

    function addKeybinding(accelerator: Electron.Accelerator) {
        let keybinding = accelerator.toString();

        if (isMacOs()) {
            keybinding = keybinding.replace("CmdOrCtrl", "Meta");
            keybinding = keybinding.replace("CommandOrControl", "Meta");
        } else {
            keybinding = keybinding.replace("CmdOrCtrl", "Ctrl");
            keybinding = keybinding.replace("CommandOrControl", "Ctrl");
        }

        keybindings.push(keybinding);
    }

    function addKeybindings(menu: Electron.MenuItemConstructorOptions[]) {
        for (let i = 0; i < menu.length; i++) {
            const menuItem = menu[i];
            if (menuItem.accelerator) {
                addKeybinding(menuItem.accelerator);
            }
            if (menuItem.submenu && "length" in menuItem.submenu) {
                addKeybindings(
                    menuItem.submenu as Electron.MenuItemConstructorOptions[]
                );
            }
        }
    }

    addKeybindings(menuTemplate);

    event.returnValue = keybindings;
});

ipcMain.on("open-file", function (event, path, runMode) {
    openFile(path, undefined, runMode);
});

ipcMain.on("new-project", function (event) {
    createNewProject();
});

ipcMain.on("open-project", function (event) {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
        openProjectWithFileDialog(focusedWindow);
    }
});
