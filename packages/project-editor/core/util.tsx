import { dialog, getCurrentWindow } from "@electron/remote";
import React from "react";

import { IDialogOptions, showDialog } from "eez-studio-ui/dialog";
import {
    DialogDefinition,
    GenericDialog,
    GenericDialogResult
} from "eez-studio-ui/generic-dialog";

import { ProjectStore, getClassInfo } from "project-editor/store";
import { ProjectContext } from "project-editor/project/context";
import type { IEezObject } from "./object";

import { isArray } from "eez-studio-shared/util";

/**
 * 显示确认对话框，用户点击“是”时执行回调。
 * @param message 主要提示信息
 * @param detail 详细说明（可选）
 * @param callback 确认后的回调函数
 */
export async function confirm(
    message: string,
    detail: string | undefined,
    callback: () => void
) {
    const result = await dialog.showMessageBox(getCurrentWindow(), {
        type: "question",
        title: "项目编辑器 - EEZ Studio",
        message: message,
        detail: detail,
        noLink: true,
        buttons: ["是", "否"],
        cancelId: 1
    });
    const buttonIndex = result.response;
    if (buttonIndex == 0) {
        callback();
    }
}

/**
 * 显示信息提示对话框，仅含“确定”按钮。
 * @param message 主要提示信息
 * @param detail 详细说明（可选）
 */
export function info(message: string, detail?: string) {
    return dialog.showMessageBox(getCurrentWindow(), {
        type: "info",
        title: "项目编辑器 - EEZ Studio",
        message: message,
        detail: detail,
        noLink: true,
        buttons: ["确定"],
        cancelId: 1
    });
}

/**
 * 显示通用对话框（基于 GenericDialog 组件）。
 * @param projectStore 项目存储实例
 * @param conf 配置项
 * @returns 返回用户输入结果的 Promise
 */
export function showGenericDialog(
    projectStore: ProjectStore,
    conf: {
        dialogDefinition: DialogDefinition;
        values: any;
        okButtonText?: string;
        okEnabled?: (result: GenericDialogResult) => boolean;
        showOkButton?: boolean;
        opts?: IDialogOptions;
        modal?: true;
        backdrop?: "static";
    }
) {
    return new Promise<GenericDialogResult>((resolve, reject) => {
        const [modalDialog] = showDialog(
            <ProjectContext.Provider value={projectStore}>
                <GenericDialog
                    dialogDefinition={conf.dialogDefinition}
                    dialogContext={undefined}
                    values={conf.values}
                    opts={conf.opts}
                    okButtonText={conf.okButtonText}
                    okEnabled={conf.okEnabled}
                    onOk={
                        conf.showOkButton === undefined || conf.showOkButton
                            ? values => {
                                  if (modalDialog) {
                                      modalDialog.close();
                                  }
                                  resolve(values);
                              }
                            : undefined
                    }
                    onCancel={() => {
                        if (modalDialog) {
                            modalDialog.close();
                        }
                        reject();
                    }}
                    modal={conf.modal}
                    backdrop={conf.backdrop}
                />
            </ProjectContext.Provider>,
            conf.opts
        );
    });
}

/**
 * 粘贴操作完成后的处理：对每个新对象调用其类定义的 onAfterPaste 方法。
 * @param newObjectOrObjects 新粘贴的对象或对象数组
 * @param fromObjectOrObjects 原始来源对象或对象数组
 */
export function onAfterPaste(
    newObjectOrObjects: IEezObject | IEezObject[],
    fromObjectOrObjects: IEezObject | IEezObject[]
) {
    let newObjects: IEezObject[];
    if (isArray(newObjectOrObjects)) {
        newObjects = newObjectOrObjects;
    } else {
        newObjects = [newObjectOrObjects];
    }

    let fromObjects: IEezObject[];
    if (isArray(fromObjectOrObjects)) {
        fromObjects = fromObjectOrObjects as IEezObject[];
    } else {
        fromObjects = [fromObjectOrObjects];
    }

    newObjects.forEach((object, i) => {
        const classInfo = getClassInfo(object);
        if (classInfo.onAfterPaste) {
            classInfo.onAfterPaste(object, fromObjects[i]);
        }
    });
}

/** 剪贴板项文件前缀标识 */
export const SCRAPBOOK_ITEM_FILE_PREFIX = "scrapbook://";

/**
 * 检查字符串是否为有效 URL（支持 http/https 或 scrapbook 协议）。
 * @param s 待检查的字符串
 * @returns 是否为有效 URL
 */
export function isValidUrl(s: string) {
    if (s.startsWith(SCRAPBOOK_ITEM_FILE_PREFIX)) {
        return true;
    }

    return /^https?:\/\/.+/.test(s);
}
