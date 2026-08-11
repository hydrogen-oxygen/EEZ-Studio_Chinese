// Calendar.tsx
import React from "react";
import { observable, makeObservable } from "mobx";

import {
    IMessage,
    MessageType,
    PropertyType,
    makeDerivedClassInfo
} from "project-editor/core/object";

import { ProjectType } from "project-editor/project/project";
import { ProjectEditor } from "project-editor/project-editor-interface";

import { specificGroup } from "project-editor/ui-components/PropertyGrid/groups";

import { LVGLWidget } from "./internal";
import { getChildOfObject, Message } from "project-editor/store";
import type { LVGLCode } from "project-editor/lvgl/to-lvgl-code";

////////////////////////////////////////////////////////////////////////////////

const CALENDAR_HEADER_TYPES = {
    无: 0,
    箭头: 1,
    下拉: 2
};

export class LVGLCalendarWidget extends LVGLWidget {
    todayYear: number;
    todayMonth: number;
    todayDay: number;
    header: keyof typeof CALENDAR_HEADER_TYPES;
    chineseMode: boolean;

    static classInfo = makeDerivedClassInfo(LVGLWidget.classInfo, {
        enabledInComponentPalette: (projectType: ProjectType, projectStore) =>
            projectType === ProjectType.LVGL,

        componentPaletteGroupName: "!1输入",

        properties: [
            {
                name: "todayYear",
                displayName: "年",
                type: PropertyType.Number,
                propertyGridGroup: specificGroup
            },
            {
                name: "todayMonth",
                displayName: "月",
                type: PropertyType.Number,
                propertyGridGroup: specificGroup
            },
            {
                name: "todayDay",
                displayName: "日",
                type: PropertyType.Number,
                propertyGridGroup: specificGroup
            },
            {
                name: "header",
                type: PropertyType.Enum,
                enumItems: Object.keys(CALENDAR_HEADER_TYPES).map(id => ({
                    id,
                    label: id
                })),
                enumDisallowUndefined: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "chineseMode",
                type: PropertyType.Boolean,
                checkboxStyleSwitch: true,
                propertyGridGroup: specificGroup,
                disabled: (widget: LVGLCalendarWidget) => {
                    const lvglVersion =
                        ProjectEditor.getProject(widget).settings.general
                            .lvglVersion;
                    return lvglVersion == "8.4.0";
                }
            }
        ],

        defaultValue: {
            left: 0,
            top: 0,
            width: 230,
            height: 240,
            clickableFlag: true,
            todayYear: 2022,
            todayMonth: 11,
            todayDay: 1,
            header: "箭头",
            chineseMode: false
        },

        beforeLoadHook: (object: LVGLCalendarWidget, jsObject: any) => {
            if (jsObject.header == undefined) {
                jsObject.header = "箭头";
            }
            if (jsObject.chineseMode == undefined) {
                jsObject.chineseMode = false;
            }
        },

        icon: (
            <svg
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
            >
                <path d="M0 0h24v24H0z" stroke="none" />
                <rect x="4" y="5" width="16" height="16" rx="2" />
                <path d="M16 3v4M8 3v4m-4 4h16m-9 4h1m0 0v3" />
            </svg>
        ),

        check: (widget: LVGLCalendarWidget, messages: IMessage[]) => {
            function dateIsValid(date: any) {
                return date instanceof Date && !isNaN(date as any);
            }

            if (!dateIsValid(new Date(`${widget.todayYear}-1-1`))) {
                messages.push(
                    new Message(
                        MessageType.ERROR,
                        `无效的年份`,
                        getChildOfObject(widget, "todayYear")
                    )
                );
            } else {
                if (
                    !dateIsValid(
                        new Date(`${widget.todayYear}-${widget.todayMonth}-1`)
                    )
                ) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `无效的月份`,
                            getChildOfObject(widget, "todayMonth")
                        )
                    );
                } else {
                    if (
                        !dateIsValid(
                            new Date(
                                `${widget.todayYear}-${widget.todayMonth}-${widget.todayDay}`
                            )
                        )
                    ) {
                        messages.push(
                            new Message(
                                MessageType.ERROR,
                                `无效的日期`,
                                getChildOfObject(widget, "todayDay")
                            )
                        );
                    }
                }
            }
        },

        lvgl: {
            parts: ["MAIN", "ITEMS"],
            defaultFlags:
                "CLICKABLE|CLICK_FOCUSABLE|GESTURE_BUBBLE|PRESS_LOCK|SCROLLABLE|SCROLL_CHAIN_HOR|SCROLL_CHAIN_VER|SCROLL_ELASTIC|SCROLL_MOMENTUM|SCROLL_WITH_ARROW|SNAPPABLE",

            oldInitFlags:
                "PRESS_LOCK|CLICK_FOCUSABLE|GESTURE_BUBBLE|SNAPPABLE|SCROLLABLE|SCROLL_ELASTIC|SCROLL_MOMENTUM|SCROLL_CHAIN",
            oldDefaultFlags:
                "CLICKABLE|PRESS_LOCK|CLICK_FOCUSABLE|GESTURE_BUBBLE|SNAPPABLE|SCROLLABLE|SCROLL_ELASTIC|SCROLL_MOMENTUM|SCROLL_CHAIN"
        }
    });

    override makeEditable() {
        super.makeEditable();

        makeObservable(this, {
            todayYear: observable,
            todayMonth: observable,
            todayDay: observable,
            header: observable,
            chineseMode: observable
        });
    }

    override toLVGLCode(code: LVGLCode) {
        code.createObject("lv_calendar_create");

        if (this.header === "箭头") {
            if (code.isLVGLVersion(["8.4.0", "9.2.2"])) {
                code.callObjectFunction(
                    "lv_calendar_header_arrow_create"
                );
            } else {
                code.callObjectFunction(
                    "lv_calendar_add_header_arrow"
                );
            }
        } else if (this.header === "下拉") {
            if (code.isLVGLVersion(["8.4.0", "9.2.2"])) {
                code.callObjectFunction(
                    "lv_calendar_header_dropdown_create"
                );
            } else {
                code.callObjectFunction(
                    "lv_calendar_add_header_dropdown"
                );
            }
        }

        code.callObjectFunction(
            "lv_calendar_set_today_date",
            this.todayYear,
            this.todayMonth,
            this.todayDay
        );

        if (code.isLVGLVersion(["8.", "9.2"])) {
            code.callObjectFunction(
                "lv_calendar_set_showed_date",
                this.todayYear,
                this.todayMonth
            );
        } else {
            code.callObjectFunction(
                "lv_calendar_set_month_shown",
                this.todayYear,
                this.todayMonth
            );
        }

        if (this.chineseMode && code.isLVGLVersion(["9."])) {
            code.callObjectFunction(
                "lv_calendar_set_chinese_mode",
                code.constant("true")
            );
        }
    }
}
