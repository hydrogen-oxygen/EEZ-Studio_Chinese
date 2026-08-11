import { dialog, BrowserWindow, getCurrentWindow } from "@electron/remote";
import { ipcRenderer } from "electron";

function mnemonicLabel(label: string): string {
    const os = require("os");

    if (os.platform() != "win32") {
        return label.replace(/\(&&\w\)|&&/g, ""); // mac/linux 上不支持助记符
    }

    return label.replace(/&&/g, "&");
}

export async function confirmSave({
    description,
    saveCallback,
    dontSaveCallback,
    cancelCallback
}: {
    description: string;
    saveCallback: () => void;
    dontSaveCallback: () => void;
    cancelCallback: () => void;
}) {
    enum ConfirmResult {
        SAVE,      // 保存
        DONT_SAVE, // 不保存
        CANCEL     // 取消
    }

    const saveButton = {
        label: mnemonicLabel("&&保存"),
        result: ConfirmResult.SAVE
    };
    const dontSaveButton = {
        label: mnemonicLabel("不&&保存"),
        result: ConfirmResult.DONT_SAVE
    };
    const cancelButton = { label: "取消", result: ConfirmResult.CANCEL };

    const os = require("os");

    const buttons: any[] = [];
    if (os.platform() == "win32") {
        buttons.push(saveButton, dontSaveButton, cancelButton);
    } else if (os.platform() == "linux") {
        buttons.push(dontSaveButton, cancelButton, saveButton);
    } else {
        buttons.push(saveButton, cancelButton, dontSaveButton);
    }

    let opts: Electron.MessageBoxOptions = {
        type: "warning",
        title: "EEZ Studio",
        message: "是否要保存更改？",
        detail:
            description + "如果不保存，你的更改将会丢失。",
        noLink: true,
        buttons: buttons.map(b => b.label),
        cancelId: buttons.indexOf(cancelButton)
    };

    if (os.platform() == "linux") {
        opts.defaultId = 2;
    }

    const result = await dialog.showMessageBox(getCurrentWindow(), opts);
    const buttonIndex = result.response;
    let choice = buttons[buttonIndex].result;
    if (choice == ConfirmResult.SAVE) {
        saveCallback();
    } else if (choice == ConfirmResult.DONT_SAVE) {
        dontSaveCallback();
    } else {
        cancelCallback();
    }
}

export function sendSimpleMessage(message: string, args: any) {
    BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send("shared/simple-message", {
            message,
            args
        });
    });
}

export function onSimpleMessage(
    message: string,
    callback: (args: any) => void
) {
    ipcRenderer.on(
        "shared/simple-message",
        (
            event: any,
            args: {
                message: string;
                args: any;
            }
        ) => {
            if (args.message === message) {
                callback(args.args);
            }
        }
    );
}

let reservedKeybindings: string[] | undefined = undefined;

function getReservedKeybindings() {
    if (!reservedKeybindings) {
        reservedKeybindings = ipcRenderer
            .sendSync("getReservedKeybindings")
            .concat([
                "Insert",       // 插入
                "Delete",       // 删除
                "Home",         // 首页
                "End",          // 结尾
                "Pageup",       // 上一页
                "Pagedown",     // 下一页
                "Scrolllock",   // 滚动锁定
                "Pause",        // 暂停
                "Arrowleft",    // 左箭头
                "Arrowright",   // 右箭头
                "Arrowup",      // 上箭头
                "Arrowdown",    // 下箭头
                "Backspace",    // 退格
                "Tab",          // 制表
                "Ctrl+C",       // 复制
                "Ctrl+V"        // 粘贴
            ]);
        console.log("保留的按键绑定", reservedKeybindings);
    }
    return reservedKeybindings!;
}

function keybindingEqual(keybinding1: string, keybinding2: string) {
    const keybinding1Parts = keybinding1.toLowerCase().split("+");
    const keybinding2Parts = keybinding2.toLowerCase().split("+");

    if (keybinding1Parts.length !== keybinding2Parts.length) {
        return false;
    }

    for (let i = 0; i < keybinding1Parts.length; i++) {
        if (keybinding2Parts.indexOf(keybinding1Parts[i]) === -1) {
            return false;
        }
    }

    return true;
}

export function isReserverdKeybinding(keybinding: string) {
    let reservedKeybindings = getReservedKeybindings();

    for (let i = 0; i < reservedKeybindings.length; i++) {
        if (keybindingEqual(keybinding, reservedKeybindings[i])) {
            return true;
        }
    }

    return false;
}
