// Scale.tsx
import React from "react";
import { observable, makeObservable } from "mobx";
import { observer } from "mobx-react";

import {
    ClassInfo,
    EezObject,
    IMessage,
    MessageType,
    PropertyInfo,
    PropertyProps,
    PropertyType,
    findPropertyByNameInClassInfo,
    makeDerivedClassInfo,
    registerClass
} from "project-editor/core/object";

import { NamingConvention, ProjectType, findFont, findLvglStyle, getName } from "project-editor/project/project";
import { BUILT_IN_FONTS, text_font_property_info } from "project-editor/lvgl/style-catalog";

import { specificGroup } from "project-editor/ui-components/PropertyGrid/groups";

import { SCALE_MODES } from "project-editor/lvgl/lvgl-constants";

import { LVGLWidget } from "./internal";
import { LVGLPropertyType, makeLvglExpressionProperty } from "../expression-property";
import { checkWidgetTypeLvglVersion, escapeCString } from "../widget-common";
import type { LVGLCode } from "project-editor/lvgl/to-lvgl-code";
import { ProjectEditor } from "project-editor/project-editor-interface";
import {
    getAncestorOfType,
    getChildOfObject,
    humanizePropertyName,
    Message,
    propertyNotFoundMessage
} from "project-editor/store";
import { checkExpression } from "project-editor/flow/expression";
import { LVGLStyle } from "project-editor/lvgl/style";

//////////////////////////////////////////////////////////////////////////////

const PropertiesSection = observer(
    class PropertiesSection extends React.Component<PropertyProps> {
        render() {
            return (
                <div style={{ marginTop: 10, fontWeight: "bold", textTransform: "uppercase", fontSize: 11 }}>
                    {humanizePropertyName(this.props.objects[0], this.props.propertyInfo.name)}
                </div>
            );
        }
    }
);

function makePropertiesSection(name: string): PropertyInfo {
    return {
        name,
        type: PropertyType.Any,
        propertyGridGroup: specificGroup,
        propertyGridRowComponent: PropertiesSection,
        computed: true,
        skipSearch: true
    };
}

////////////////////////////////////////////////////////////////////////////////

export class LVGLScaleSection extends EezObject {
    identifier: string;

    minValue: number | string;
    minValueType: LVGLPropertyType;
    maxValue: number | string;
    maxValueType: LVGLPropertyType;

    useStyle: string;

    // 主样式 (LV_PART_MAIN)
    mainWidth: number;
    mainColor: string;
    mainOpacity: number;

    // 次刻度线样式 (LV_PART_ITEMS)
    minorTicksWidth: number;
    minorTicksColor: string;
    minorTicksOpacity: number;

    // 主刻度线样式 (LV_PART_INDICATOR)
    majorTicksWidth: number;
    majorTicksColor: string;
    majorTicksOpacity: number;

    // 标签样式 (LV_PART_INDICATOR)
    labelsTextColor: string;
    labelsTextOpacity: number;
    labelsTextFont: string;

    static classInfo: ClassInfo = {
        properties: [
            {
                name: "identifier",
                displayName: "名称",
                type: PropertyType.String,
                isOptional: true
            },
            {
                name: "codeIdentifier",
                type: PropertyType.String,
                computed: true,
                formText: `此标识符将用于生成的源代码。它与上面的"名称"不同，因为在源代码中我们遵循"小写加下划线"命名约定。`,
                disabled: (object: LVGLWidget) => object.codeIdentifier == undefined
            },            
            ...makeLvglExpressionProperty("minValue", "integer", "input", ["literal", "expression"], {
                displayName: "最小值"
            }),
            ...makeLvglExpressionProperty("maxValue", "integer", "input", ["literal", "expression"], {
                displayName: "最大值"
            }),

            {
                name: "useStyle",
                type: PropertyType.ObjectReference,
                referencedObjectCollectionPath: "allLvglStyles",
                filterReferencedObjectCollection: (_objects: LVGLScaleSection[], lvglStyle: LVGLStyle) =>
                    lvglStyle.forWidgetType == "LVGLScaleWidget"
            },

            // 主样式 (LV_PART_MAIN)
            makePropertiesSection("mainStyles"),

            {
                name: "mainWidth",
                displayName: "主宽度",
                type: PropertyType.Number,
                isOptional: true
            },
            {
                name: "mainColor",
                displayName: "主颜色",
                type: PropertyType.ThemedColor,
                isOptional: true
            },
            {
                name: "mainOpacity",
                displayName: "主透明度",
                type: PropertyType.Number,
                isOptional: true
            },

            // 次刻度线样式 (LV_PART_ITEMS)
            makePropertiesSection("minorTicksStyles"),

            {
                name: "minorTicksWidth",
                displayName: "次刻度线宽度",
                type: PropertyType.Number,
                isOptional: true
            },
            {
                name: "minorTicksColor",
                displayName: "次刻度线颜色",
                type: PropertyType.ThemedColor,
                isOptional: true
            },
            {
                name: "minorTicksOpacity",
                displayName: "次刻度线透明度",
                type: PropertyType.Number,
                isOptional: true
            },

            // 主刻度线样式 (LV_PART_INDICATOR)
            makePropertiesSection("majorTicksStyles"),

            {
                name: "majorTicksWidth",
                displayName: "主刻度线宽度",
                type: PropertyType.Number,
                isOptional: true
            },
            {
                name: "majorTicksColor",
                displayName: "主刻度线颜色",
                type: PropertyType.ThemedColor,
                isOptional: true
            },
            {
                name: "majorTicksOpacity",
                displayName: "主刻度线透明度",
                type: PropertyType.Number,
                isOptional: true
            },

            // 标签样式 (LV_PART_INDICATOR)
            makePropertiesSection("labelsStyles"),
            {
                name: "labelsTextColor",
                displayName: "标签文字颜色",
                type: PropertyType.ThemedColor,
                isOptional: true
            },
            {
                name: "labelsTextOpacity",
                displayName: "标签文字透明度",
                type: PropertyType.Number,
                isOptional: true
            },
            {
                name: "labelsTextFont",
                displayName: "标签文字字体",
                type: PropertyType.Enum,
                enumItems: text_font_property_info.enumItems,
                isOptional: true,
                referencedObjectCollectionPath: "fonts"
            }
        ],

        listLabel: (section: LVGLScaleSection, collapsed: boolean) => "段落",

        defaultValue: {
            minValue: 0,
            minValueType: "literal",
            maxValue: 100,
            maxValueType: "literal",

            useStyle: "",

            // 主样式
            mainWidth: undefined,
            mainColor: undefined,
            mainOpacity: undefined,

            // 次刻度线样式
            minorTicksWidth: undefined,
            minorTicksColor: undefined,
            minorTicksOpacity: undefined,

            // 主刻度线样式
            majorTicksWidth: undefined,
            majorTicksColor: undefined,
            majorTicksOpacity: undefined,

            // 标签样式
            labelsTextColor: undefined,
            labelsTextOpacity: undefined,
            labelsTextFont: undefined
        },

        beforeLoadHook: (_object: LVGLScaleSection, jsObject: any) => {
            if (jsObject.minorRange != undefined) {
                jsObject.minValue = jsObject.minorRange;
            }
            if (jsObject.majorRange != undefined) {
                jsObject.maxValue = jsObject.majorRange;
            }
        },

        check: (section: LVGLScaleSection, messages: IMessage[]) => {
            if (section.minValueType == "literal") {
                if (
                    section.minValue == undefined ||
                    section.minValue == null ||
                    !Number.isInteger(Number(section.minValue))
                ) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `最小值必须是整数`,
                            getChildOfObject(section, "minValue")
                        )
                    );
                }
            } else if (section.minValueType == "expression") {
                try {
                    const widget = getAncestorOfType<LVGLWidget>(section, LVGLWidget.classInfo)!;

                    checkExpression(widget, section.minValue as string);
                } catch (err) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `无效表达式: ${err}`,
                            getChildOfObject(section, "minValue")
                        )
                    );
                }
            }

            if (section.maxValueType == "literal") {
                if (
                    section.maxValue == undefined ||
                    section.maxValue == null ||
                    !Number.isInteger(Number(section.maxValue))
                ) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `最大值必须是整数`,
                            getChildOfObject(section, "maxValue")
                        )
                    );
                }
            } else if (section.maxValueType == "expression") {
                try {
                    const widget = getAncestorOfType<LVGLWidget>(section, LVGLWidget.classInfo)!;

                    checkExpression(widget, section.maxValue as string);
                } catch (err) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `无效表达式: ${err}`,
                            getChildOfObject(section, "maxValue")
                        )
                    );
                }
            }

            if (section.useStyle) {
                const project = ProjectEditor.getProject(section);
                const style = findLvglStyle(project, section.useStyle);
                if (style) {
                    if (style.forWidgetType != "LVGLScaleWidget") {
                        let widgetType = style.forWidgetType.startsWith("LVGL") ? style.forWidgetType.substring(4) : style.forWidgetType;
                        widgetType = style.forWidgetType.endsWith("Widget") ? widgetType.substring(0, widgetType.length - 6) : widgetType;
                        messages.push(
                            new Message(
                                MessageType.ERROR,
                                `样式"${section.useStyle}"适用于控件类型"${widgetType}"，不能用于刻度控件。`,
                                getChildOfObject(section, "useStyle")
                            )
                        );
                    }
                } else {
                    messages.push(propertyNotFoundMessage(section, "useStyle"));
                }
            }
        }
    };

    override makeEditable() {
        super.makeEditable();

        makeObservable(this, {
            identifier: observable,

            minValue: observable,
            minValueType: observable,
            maxValue: observable,
            maxValueType: observable,

            useStyle: observable,

            // 主样式
            mainWidth: observable,
            mainColor: observable,
            mainOpacity: observable,

            // 次刻度线样式
            minorTicksWidth: observable,
            minorTicksColor: observable,
            minorTicksOpacity: observable,

            // 主刻度线样式
            majorTicksWidth: observable,
            majorTicksColor: observable,
            majorTicksOpacity: observable,

            // 标签样式
            labelsTextColor: observable,
            labelsTextOpacity: observable,
            labelsTextFont: observable
        });
    }

    get codeIdentifier() {
        if (!this.identifier) {
            return undefined;
        }

        const codeIdentifier = getName("", this.identifier, NamingConvention.UnderscoreLowerCase);

        if (codeIdentifier == this.identifier) {
            return undefined;
        }

        return codeIdentifier;
    }
}

registerClass("LVGLScaleSection", LVGLScaleSection);

////////////////////////////////////////////////////////////////////////////////

export class LVGLScaleWidget extends LVGLWidget {
    scaleMode: keyof typeof SCALE_MODES;
    minValue: number | string;
    minValueType: LVGLPropertyType;
    maxValue: number | string;
    maxValueType: LVGLPropertyType;
    angleRange: number;
    rotation: number | string;
    rotationType: LVGLPropertyType;
    totalTickCount: number;
    majorTickEvery: number;
    postDraw: boolean;
    drawTicksOnTop: boolean;
    showLabels: boolean;
    labelTexts: string;
    sections: LVGLScaleSection[];

    // 主线样式（直线模式）
    mainLineWidth: number;
    mainLineColor: string;
    mainLineOpacity: number;

    // 主弧样式（圆形模式）
    mainArcWidth: number;
    mainArcColor: string;
    mainArcOpacity: number;
    mainArcRounded: boolean;
    mainArcImageSrc: string;

    // 次刻度线样式 (LV_PART_ITEMS)
    minorTicksLength: number;
    minorTicksWidth: number;
    minorTicksColor: string;
    minorTicksOpacity: number;

    // 主刻度线样式 (LV_PART_INDICATOR)
    majorTicksLength: number;
    majorTicksWidth: number;
    majorTicksColor: string;
    majorTicksOpacity: number;

    // 标签样式 (LV_PART_INDICATOR)
    labelsTextColor: string;
    labelsTextOpacity: number;
    labelsTextFont: string;

    static classInfo = makeDerivedClassInfo(LVGLWidget.classInfo, {
        enabledInComponentPalette: (projectType: ProjectType, projectStore) =>
            projectType === ProjectType.LVGL &&
            (!projectStore || projectStore.project.settings.general.lvglVersion.startsWith("9.")),

        componentPaletteGroupName: "!1可视化",

        properties: [
            {
                name: "scaleMode",
                type: PropertyType.Enum,
                enumItems: Object.keys(SCALE_MODES).map(id => ({
                    id,
                    label: id
                })),
                enumDisallowUndefined: true,
                propertyGridGroup: specificGroup
            },
            ...makeLvglExpressionProperty("minValue", "integer", "input", ["literal", "expression"], {
                displayName: "最小值",
                propertyGridGroup: specificGroup
            }),
            ...makeLvglExpressionProperty("maxValue", "integer", "input", ["literal", "expression"], {
                displayName: "最大值",
                propertyGridGroup: specificGroup
            }),
            {
                name: "angleRange",
                displayName: "角度范围",
                type: PropertyType.Number,
                propertyGridGroup: specificGroup
            },
            ...makeLvglExpressionProperty("rotation", "integer", "input", ["literal", "expression"], {
                propertyGridGroup: specificGroup
            }),
            {
                name: "totalTickCount",
                displayName: "刻度线总数",
                type: PropertyType.Number,
                propertyGridGroup: specificGroup
            },
            {
                name: "majorTickEvery",
                displayName: "主刻度线间隔",
                type: PropertyType.Number,
                propertyGridGroup: specificGroup
            },
            {
                name: "postDraw",
                displayName: "后绘制",
                type: PropertyType.Boolean,
                checkboxStyleSwitch: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "drawTicksOnTop",
                displayName: "刻度线置于上层",
                type: PropertyType.Boolean,
                checkboxStyleSwitch: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "showLabels",
                type: PropertyType.Boolean,
                checkboxStyleSwitch: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "labelTexts",
                displayName: "标签文本",
                type: PropertyType.MultilineText,
                propertyGridGroup: specificGroup,
                formText: "以逗号分隔的标签文本列表"
            },

            // 主线样式（直线模式 - LV_PART_MAIN）
            makePropertiesSection("mainStyles"),

            {
                name: "mainLineWidth",
                displayName: "主线宽度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode === "ROUND_INNER" || widget.scaleMode === "ROUND_OUTER"
            },
            {
                name: "mainLineColor",
                displayName: "主线颜色",
                type: PropertyType.ThemedColor,
                isOptional: true,
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode === "ROUND_INNER" || widget.scaleMode === "ROUND_OUTER"
            },
            {
                name: "mainLineOpacity",
                displayName: "主线透明度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode === "ROUND_INNER" || widget.scaleMode === "ROUND_OUTER"
            },

            // 主弧样式（圆形模式 - LV_PART_MAIN）
            {
                name: "mainArcWidth",
                displayName: "主弧宽度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode !== "ROUND_INNER" && widget.scaleMode !== "ROUND_OUTER"
            },
            {
                name: "mainArcColor",
                displayName: "主弧颜色",
                type: PropertyType.ThemedColor,
                isOptional: true,
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode !== "ROUND_INNER" && widget.scaleMode !== "ROUND_OUTER"
            },
            {
                name: "mainArcOpacity",
                displayName: "主弧透明度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode !== "ROUND_INNER" && widget.scaleMode !== "ROUND_OUTER"
            },
            {
                name: "mainArcRounded",
                displayName: "主弧圆角",
                type: PropertyType.Boolean,
                isOptional: true,
                checkboxStyleSwitch: true,
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode !== "ROUND_INNER" && widget.scaleMode !== "ROUND_OUTER"
            },
            {
                name: "mainArcImageSrc",
                displayName: "主弧图像",
                type: PropertyType.ObjectReference,
                isOptional: true,
                referencedObjectCollectionPath: "bitmaps",
                propertyGridGroup: specificGroup,
                hideInPropertyGrid: (widget: LVGLScaleWidget) =>
                    widget.scaleMode !== "ROUND_INNER" && widget.scaleMode !== "ROUND_OUTER"
            },

            // 次刻度线样式 (LV_PART_ITEMS)
            makePropertiesSection("minorTicksStyles"),
            {
                name: "minorTicksLength",
                displayName: "次刻度线长度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "minorTicksWidth",
                displayName: "次刻度线宽度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "minorTicksColor",
                displayName: "次刻度线颜色",
                type: PropertyType.ThemedColor,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "minorTicksOpacity",
                displayName: "次刻度线透明度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup
            },

            // 主刻度线样式 (LV_PART_INDICATOR)
            makePropertiesSection("majorTicksStyles"),
            {
                name: "majorTicksLength",
                displayName: "主刻度线长度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "majorTicksWidth",
                displayName: "主刻度线宽度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "majorTicksColor",
                displayName: "主刻度线颜色",
                type: PropertyType.ThemedColor,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "majorTicksOpacity",
                displayName: "主刻度线透明度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup
            },

            // 标签样式 (LV_PART_INDICATOR)
            makePropertiesSection("labelsStyles"),
            {
                name: "labelsTextColor",
                displayName: "标签文字颜色",
                type: PropertyType.ThemedColor,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "labelsTextOpacity",
                displayName: "标签文字透明度",
                type: PropertyType.Number,
                isOptional: true,
                propertyGridGroup: specificGroup
            },
            {
                name: "labelsTextFont",
                displayName: "标签文字字体",
                type: PropertyType.Enum,
                enumItems: text_font_property_info.enumItems,
                isOptional: true,
                referencedObjectCollectionPath: "fonts",
                propertyGridGroup: specificGroup
            },

            {
                name: "sections",
                type: PropertyType.Array,
                typeClass: LVGLScaleSection,
                propertyGridGroup: specificGroup,
                partOfNavigation: false,
                enumerable: false,
                defaultValue: []
            }
        ],

        defaultValue: {
            left: 0,
            top: 0,
            width: 240,
            height: 40,
            clickableFlag: true,
            scaleMode: "HORIZONTAL_BOTTOM",
            localStyles: {},
            minValue: 10,
            minValueType: "literal",
            maxValue: 40,
            maxValueType: "literal",
            angleRange: 270,
            rotation: 135,
            rotationType: "literal",
            totalTickCount: 31,
            majorTickEvery: 5,
            postDraw: false,
            drawTicksOnTop: false,
            showLabels: true,
            labelTexts: "",
            sections: [],

            // 主线样式（直线模式）
            mainLineWidth: undefined,
            mainLineColor: undefined,
            mainLineOpacity: undefined,

            // 主弧样式（圆形模式）
            mainArcWidth: undefined,
            mainArcColor: undefined,
            mainArcOpacity: undefined,
            mainArcRounded: false,
            mainArcImageSrc: undefined,

            // 次刻度线样式
            minorTicksLength: undefined,
            minorTicksWidth: undefined,
            minorTicksColor: undefined,
            minorTicksOpacity: undefined,

            // 主刻度线样式
            majorTicksLength: undefined,
            majorTicksWidth: undefined,
            majorTicksColor: undefined,
            majorTicksOpacity: undefined,

            // 标签样式
            labelsTextColor: undefined,
            labelsTextOpacity: undefined,
            labelsTextFont: undefined
        },

        beforeLoadHook: (_object: LVGLScaleWidget, jsObject: Partial<LVGLScaleWidget>) => {
            if (jsObject.minValueType == undefined) {
                jsObject.minValueType = "literal";
            }
            if (jsObject.maxValueType == undefined) {
                jsObject.maxValueType = "literal";
            }
            if (jsObject.rotationType == undefined) {
                jsObject.rotationType = "literal";
            }
            // 迁移旧的 minorRange/majorRange 到 minValue/maxValue
            if ((jsObject as any).minorRange != undefined && jsObject.minValue == undefined) {
                jsObject.minValue = (jsObject as any).minorRange;
                delete (jsObject as any).minorRange;
            }
            if ((jsObject as any).majorRange != undefined && jsObject.maxValue == undefined) {
                jsObject.maxValue = (jsObject as any).majorRange;
                delete (jsObject as any).majorRange;
            }
        },

        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="2 2 20 18"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
            >
                <path d="M19.875 8C20.496 8 21 8.512 21 9.143v5.714c0 .631-.504 1.143-1.125 1.143H4a1 1 0 0 1-1-1V9.143C3 8.512 3.504 8 4.125 8h15.75zM9 8v2M6 8v3M12 8v3M18 8v3M15 8v2" />
            </svg>
        ),

        lvgl: {
            parts: ["MAIN", "ITEMS", "INDICATOR"],
            defaultFlags:
                "CLICKABLE|CLICK_FOCUSABLE|GESTURE_BUBBLE|PRESS_LOCK|SCROLLABLE|SCROLL_CHAIN_HOR|SCROLL_CHAIN_VER|SCROLL_ELASTIC|SCROLL_MOMENTUM|SCROLL_WITH_ARROW|SNAPPABLE",

            oldInitFlags:
                "PRESS_LOCK|CLICK_FOCUSABLE|GESTURE_BUBBLE|SNAPPABLE|SCROLLABLE|SCROLL_ELASTIC|SCROLL_MOMENTUM|SCROLL_CHAIN",
            oldDefaultFlags:
                "CLICKABLE|PRESS_LOCK|CLICK_FOCUSABLE|GESTURE_BUBBLE|SNAPPABLE|SCROLLABLE|SCROLL_ELASTIC|SCROLL_MOMENTUM|SCROLL_CHAIN"
        },

        check: (widget: LVGLScaleWidget, messages: IMessage[]) => {
            checkWidgetTypeLvglVersion(widget, messages, "9.");

            if (widget.angleRange == undefined || widget.angleRange == null || !Number.isInteger(widget.angleRange)) {
                messages.push(
                    new Message(
                        MessageType.ERROR,
                        `角度范围必须是整数`,
                        getChildOfObject(widget, "angleRange")
                    )
                );
            }

            if (widget.rotationType == "literal") {
                if (
                    widget.rotation == undefined ||
                    widget.rotation == null ||
                    !Number.isInteger(Number(widget.rotation))
                ) {
                    messages.push(
                        new Message(MessageType.ERROR, `旋转角度必须是整数`, getChildOfObject(widget, "rotation"))
                    );
                }
            }

            if (widget.minValueType == "literal") {
                if (
                    widget.minValue == undefined ||
                    widget.minValue == null ||
                    !Number.isInteger(Number(widget.minValue))
                ) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `最小值必须是整数`,
                            getChildOfObject(widget, "minValue")
                        )
                    );
                }
            }

            if (widget.maxValueType == "literal") {
                if (
                    widget.maxValue == undefined ||
                    widget.maxValue == null ||
                    !Number.isInteger(Number(widget.maxValue))
                ) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `最大值必须是整数`,
                            getChildOfObject(widget, "maxValue")
                        )
                    );
                }
            }

            if (
                widget.totalTickCount == undefined ||
                widget.totalTickCount == null ||
                !Number.isInteger(widget.totalTickCount)
            ) {
                messages.push(
                    new Message(
                        MessageType.ERROR,
                        `刻度线总数必须是整数`,
                        getChildOfObject(widget, "totalTickCount")
                    )
                );
            }

            if (
                widget.majorTickEvery == undefined ||
                widget.majorTickEvery == null ||
                !Number.isInteger(widget.majorTickEvery)
            ) {
                messages.push(
                    new Message(
                        MessageType.ERROR,
                        `主刻度线间隔必须是整数`,
                        getChildOfObject(widget, "majorTickEvery")
                    )
                );
            }
        },
        getAdditionalFlowProperties: (widget: LVGLScaleWidget) => {
            const properties: PropertyInfo[] = [];

            if (ProjectEditor.getProject(widget).projectTypeTraits.hasFlowSupport) {
                for (let sectionIndex = 0; sectionIndex < widget.sections.length; sectionIndex++) {
                    let section = widget.sections[sectionIndex];

                    if (section.minValueType == "expression") {
                        properties.push(
                            Object.assign({}, findPropertyByNameInClassInfo(LVGLScaleSection.classInfo, "minValue"), {
                                name: `sections[${sectionIndex}].minValue`
                            })
                        );
                    }

                    if (section.maxValueType == "expression") {
                        properties.push(
                            Object.assign({}, findPropertyByNameInClassInfo(LVGLScaleSection.classInfo, "maxValue"), {
                                name: `sections[${sectionIndex}].maxValue`
                            })
                        );
                    }
                }
            }

            return properties;
        }
    });

    override makeEditable() {
        super.makeEditable();

        makeObservable(this, {
            scaleMode: observable,
            minValue: observable,
            minValueType: observable,
            maxValue: observable,
            maxValueType: observable,
            angleRange: observable,
            rotation: observable,
            rotationType: observable,
            totalTickCount: observable,
            majorTickEvery: observable,
            postDraw: observable,
            drawTicksOnTop: observable,
            showLabels: observable,
            labelTexts: observable,
            sections: observable,

            // 主线样式（直线模式）
            mainLineWidth: observable,
            mainLineColor: observable,
            mainLineOpacity: observable,

            // 主弧样式（圆形模式）
            mainArcWidth: observable,
            mainArcColor: observable,
            mainArcOpacity: observable,
            mainArcRounded: observable,
            mainArcImageSrc: observable,

            // 次刻度线样式
            minorTicksLength: observable,
            minorTicksWidth: observable,
            minorTicksColor: observable,
            minorTicksOpacity: observable,

            // 主刻度线样式
            majorTicksLength: observable,
            majorTicksWidth: observable,
            majorTicksColor: observable,
            majorTicksOpacity: observable,

            // 标签样式
            labelsTextColor: observable,
            labelsTextOpacity: observable,
            labelsTextFont: observable
        });
    }

    override toLVGLCode(code: LVGLCode) {
        if (!code.isV9) {
            // 刻度控件在 LVGL 8.x 版本中不存在
            code.createObject("lv_obj_create");
            return;
        }

        code.createObject(`lv_scale_create`);

        const scaleObjectAccessor = code.objectAccessor;

        // scaleMode
        code.callObjectFunction("lv_scale_set_mode", code.constant(`LV_SCALE_MODE_${this.scaleMode}`));

        // minValue and maxValue
        if (this.minValueType == "literal" && this.maxValueType == "literal") {
            code.callObjectFunction("lv_scale_set_range", this.minValue, this.maxValue);
        } else if (this.minValueType == "literal") {
            code.callObjectFunction("lv_scale_set_range", this.minValue, 0);
        } else if (this.maxValueType == "literal") {
            code.callObjectFunction("lv_scale_set_range", 0, this.maxValue);
        }

        if (this.minValueType == "expression") {
            code.addToTick("minValue", () => {
                const new_val = code.evalIntegerProperty(
                    "int32_t",
                    "new_val",
                    this.minValue as string,
                    "刻度控件中最小值表达式求值失败"
                );

                const cur_val = code.callObjectFunctionWithAssignment(
                    "int32_t",
                    "cur_val",
                    "lv_scale_get_range_min_value"
                );

                code.ifNotEqual(new_val, cur_val, () => {
                    code.tickChangeStart();

                    const min = code.assign("int32_t", "min", new_val);

                    const max = code.callObjectFunctionWithAssignment("int32_t", "max", "lv_scale_get_range_max_value");

                    code.callObjectFunction("lv_scale_set_range", min, max);

                    code.tickChangeEnd();
                });
            });
        }

        if (this.maxValueType == "expression") {
            code.addToTick("maxValue", () => {
                const new_val = code.evalIntegerProperty(
                    "int32_t",
                    "new_val",
                    this.maxValue as string,
                    "刻度控件中最大值表达式求值失败"
                );

                const cur_val = code.callObjectFunctionWithAssignment(
                    "int32_t",
                    "cur_val",
                    "lv_scale_get_range_max_value"
                );

                code.ifNotEqual(new_val, cur_val, () => {
                    code.tickChangeStart();

                    const min = code.callObjectFunctionWithAssignment("int32_t", "min", "lv_scale_get_range_min_value");

                    const max = code.assign("int32_t", "max", new_val);

                    code.callObjectFunction("lv_scale_set_range", min, max);

                    code.tickChangeEnd();
                });
            });
        }

        // angleRange
        if (this.angleRange != undefined) {
            code.callObjectFunction("lv_scale_set_angle_range", this.angleRange);
        }

        // rotation
        if (this.rotationType == "literal") {
            if (this.rotation != undefined) {
                code.callObjectFunction("lv_scale_set_rotation", this.rotation);
            }
        } else if (this.rotationType == "expression") {
            code.addToTick("rotation", () => {
                const new_val = code.evalIntegerProperty(
                    "int32_t",
                    "new_val",
                    this.rotation as string,
                    "刻度控件中旋转角度表达式求值失败"
                );

                const cur_val = code.callObjectFunctionWithAssignment(
                    "int32_t",
                    "cur_val",
                    "lv_scale_get_rotation"
                );

                code.ifNotEqual(new_val, cur_val, () => {
                    code.tickChangeStart();
                    code.callObjectFunction("lv_scale_set_rotation", new_val);
                    code.tickChangeEnd();
                });
            });
        }

        // totalTickCount
        code.callObjectFunction("lv_scale_set_total_tick_count", this.totalTickCount);

        // majorTickEvery
        code.callObjectFunction("lv_scale_set_major_tick_every", this.majorTickEvery);

        // postDraw
        if (this.postDraw) {
            code.callObjectFunction("lv_scale_set_post_draw", code.constant("true"));
        }

        // drawTicksOnTop
        if (this.drawTicksOnTop) {
            code.callObjectFunction("lv_scale_set_draw_ticks_on_top", code.constant("true"));
        }

        // showLabels
        code.callObjectFunction("lv_scale_set_label_show", code.constant(this.showLabels ? "true" : "false"));

        // labelTexts
        if (this.labelTexts) {
            const labels = this.labelTexts.split(",").filter(l => l.length > 0);

            if (labels.length > 0) {
                if (code.lvglBuild) {
                    const build = code.lvglBuild;

                    build.blockStart(`static const char *label_texts[${labels.length + 1}] = {`);
                    for (const label of labels) {
                        build.line(`${escapeCString(label)},`);
                    }
                    build.line(`NULL`);
                    build.blockEnd(`};`);

                    code.callObjectFunction("lv_scale_set_text_src", "label_texts");
                } else {
                    const runtime = code.pageRuntime!;

                    const textsArray = new Uint32Array(labels.length + 1);
                    for (let i = 0; i < labels.length; i++) {
                        textsArray[i] = runtime.wasm.stringToNewUTF8(labels[i]);
                    }
                    textsArray[labels.length] = 0;

                    const textsBuffer = runtime.wasm._malloc(textsArray.length * textsArray.BYTES_PER_ELEMENT);

                    runtime.wasm.HEAPU32.set(textsArray, textsBuffer >> 2);

                    code.callObjectFunction("lv_scale_set_text_src", textsBuffer);
                }
            }
        }

        const isRoundMode = this.scaleMode === "ROUND_INNER" || this.scaleMode === "ROUND_OUTER";

        code.postWidgetExecute(() => {
            // 主线内联样式（直线模式 - LV_PART_MAIN）

            if (!isRoundMode) {
                if (this.mainLineWidth != undefined) {
                    code.callObjectFunction(
                        "lv_obj_set_style_line_width",
                        this.mainLineWidth,
                        code.constant("LV_PART_MAIN")
                    );
                }
                if (this.mainLineColor) {
                    code.buildColor(
                        this,
                        this.mainLineColor,
                        () => code.objectAccessor,
                        color => {
                            code.callObjectFunction(
                                "lv_obj_set_style_line_color",
                                code.color(color),
                                code.constant("LV_PART_MAIN")
                            );
                        },
                        (color, obj) => {
                            if (code.lvglBuild && code.screensLifetimeSupport) {
                                const build = code.lvglBuild;
                                build.line(
                                    `if (${obj}) lv_obj_set_style_line_color(${obj}, ${code.color(color)}, LV_PART_MAIN);`
                                );
                            } else {
                                code.callFreeFunction(
                                    "lv_obj_set_style_line_color",
                                    obj,
                                    code.color(color),
                                    code.constant("LV_PART_MAIN")
                                );
                            }
                        }
                    );
                }
                if (this.mainLineOpacity != undefined) {
                    code.callObjectFunction(
                        "lv_obj_set_style_line_opa",
                        this.mainLineOpacity,
                        code.constant("LV_PART_MAIN")
                    );
                }
            }

            // 主弧内联样式（圆形模式 - LV_PART_MAIN）
            if (isRoundMode) {
                if (this.mainArcWidth != undefined) {
                    code.callObjectFunction(
                        "lv_obj_set_style_arc_width",
                        this.mainArcWidth,
                        code.constant("LV_PART_MAIN")
                    );
                }
                if (this.mainArcColor) {
                    code.buildColor(
                        this,
                        this.mainArcColor,
                        () => code.objectAccessor,
                        color => {
                            code.callObjectFunction(
                                "lv_obj_set_style_arc_color",
                                code.color(color),
                                code.constant("LV_PART_MAIN")
                            );
                        },
                        (color, obj) => {
                            if (code.lvglBuild && code.screensLifetimeSupport) {
                                const build = code.lvglBuild;
                                build.line(
                                    `if (${obj}) lv_obj_set_style_arc_color(${obj}, ${code.color(color)}, LV_PART_MAIN);`
                                );
                            } else {
                                code.callFreeFunction(
                                    "lv_obj_set_style_arc_color",
                                    obj,
                                    code.color(color),
                                    code.constant("LV_PART_MAIN")
                                );
                            }
                        }
                    );
                }
                if (this.mainArcOpacity != undefined) {
                    code.callObjectFunction(
                        "lv_obj_set_style_arc_opa",
                        this.mainArcOpacity,
                        code.constant("LV_PART_MAIN")
                    );
                }
                if (this.mainArcRounded) {
                    code.callObjectFunction(
                        "lv_obj_set_style_arc_rounded",
                        code.constant("true"),
                        code.constant("LV_PART_MAIN")
                    );
                }
                if (this.mainArcImageSrc) {
                    const imageAccessor = code.image(this.mainArcImageSrc);
                    if (imageAccessor) {
                        code.callObjectFunction(
                            "lv_obj_set_style_arc_image_src",
                            imageAccessor,
                            code.constant("LV_PART_MAIN")
                        );
                    }
                }
            }

            // 次刻度线内联样式 (LV_PART_ITEMS)
            if (this.minorTicksLength != undefined) {
                code.callObjectFunction(
                    "lv_obj_set_style_length",
                    this.minorTicksLength,
                    code.constant("LV_PART_ITEMS")
                );
            }
            if (this.minorTicksWidth != undefined) {
                code.callObjectFunction(
                    "lv_obj_set_style_line_width",
                    this.minorTicksWidth,
                    code.constant("LV_PART_ITEMS")
                );
            }
            if (this.minorTicksColor) {
                code.buildColor(
                    this,
                    this.minorTicksColor,
                    () => code.objectAccessor,
                    color => {
                        code.callObjectFunction(
                            "lv_obj_set_style_line_color",
                            code.color(color),
                            code.constant("LV_PART_ITEMS")
                        );
                    },
                    (color, obj) => {
                        if (code.lvglBuild && code.screensLifetimeSupport) {
                            const build = code.lvglBuild;
                            build.line(
                                `if (${obj}) lv_obj_set_style_line_color(${obj}, ${code.color(color)}, LV_PART_ITEMS);`
                            );
                        } else {
                            code.callFreeFunction(
                                "lv_obj_set_style_line_color",
                                obj,
                                code.color(color),
                                code.constant("LV_PART_ITEMS")
                            );
                        }
                    }
                );
            }
            if (this.minorTicksOpacity != undefined) {
                code.callObjectFunction(
                    "lv_obj_set_style_line_opa",
                    this.minorTicksOpacity,
                    code.constant("LV_PART_ITEMS")
                );
            }

            // 主刻度线内联样式 (LV_PART_INDICATOR)
            if (this.majorTicksLength != undefined) {
                code.callObjectFunction(
                    "lv_obj_set_style_length",
                    this.majorTicksLength,
                    code.constant("LV_PART_INDICATOR")
                );
            }
            if (this.majorTicksWidth != undefined) {
                code.callObjectFunction(
                    "lv_obj_set_style_line_width",
                    this.majorTicksWidth,
                    code.constant("LV_PART_INDICATOR")
                );
            }
            if (this.majorTicksColor) {
                code.buildColor(
                    this,
                    this.majorTicksColor,
                    () => code.objectAccessor,
                    color => {
                        code.callObjectFunction(
                            "lv_obj_set_style_line_color",
                            code.color(color),
                            code.constant("LV_PART_INDICATOR")
                        );
                    },
                    (color, obj) => {
                        if (code.lvglBuild && code.screensLifetimeSupport) {
                            const build = code.lvglBuild;
                            build.line(
                                `if (${obj}) lv_obj_set_style_line_color(${obj}, ${code.color(color)}, LV_PART_INDICATOR);`
                            );
                        } else {
                            code.callFreeFunction(
                                "lv_obj_set_style_line_color",
                                obj,
                                code.color(color),
                                code.constant("LV_PART_INDICATOR")
                            );
                        }
                    }
                );
            }
            if (this.majorTicksOpacity != undefined) {
                code.callObjectFunction(
                    "lv_obj_set_style_line_opa",
                    this.majorTicksOpacity,
                    code.constant("LV_PART_INDICATOR")
                );
            }

            // 标签内联样式 (LV_PART_INDICATOR)
            if (this.labelsTextColor) {
                code.buildColor(
                    this,
                    this.labelsTextColor,
                    () => code.objectAccessor,
                    color => {
                        code.callObjectFunction(
                            "lv_obj_set_style_text_color",
                            code.color(color),
                            code.constant("LV_PART_INDICATOR")
                        );
                    },
                    (color, obj) => {
                        if (code.lvglBuild && code.screensLifetimeSupport) {
                            const build = code.lvglBuild;
                            build.line(
                                `if (${obj}) lv_obj_set_style_text_color(${obj}, ${code.color(color)}, LV_PART_INDICATOR);`
                            );
                        } else {
                            code.callFreeFunction(
                                "lv_obj_set_style_text_color",
                                obj,
                                code.color(color),
                                code.constant("LV_PART_INDICATOR")
                            );
                        }
                    }
                );
            }
            if (this.labelsTextOpacity != undefined) {
                code.callObjectFunction(
                    "lv_obj_set_style_text_opa",
                    this.labelsTextOpacity,
                    code.constant("LV_PART_INDICATOR")
                );
            }
            if (this.labelsTextFont) {
                const fontIndex = BUILT_IN_FONTS.indexOf(this.labelsTextFont);
                if (code.lvglBuild) {
                    if (fontIndex != -1) {
                        // 内置字体
                        code.callObjectFunction(
                            "lv_obj_set_style_text_font",
                            `&lv_font_${this.labelsTextFont.toLowerCase()}`,
                            code.constant("LV_PART_INDICATOR")
                        );
                    } else {
                        // 自定义字体
                        const font = findFont(ProjectEditor.getProject(this), this.labelsTextFont);
                        if (font) {
                            code.callObjectFunction(
                                "lv_obj_set_style_text_font",
                                code.lvglBuild.getFontAccessor(font),
                                code.constant("LV_PART_INDICATOR")
                            );
                        }
                    }
                } else {
                    const pageRuntime = code.pageRuntime!;
                    if (fontIndex != -1) {
                        pageRuntime.wasm._lvglObjSetLocalStylePropBuiltInFont(
                            code.objectAccessor,
                            pageRuntime.getLvglStylePropCode(text_font_property_info.lvglStyleProp.code),
                            fontIndex,
                            0
                        );
                    } else {
                        const font = findFont(ProjectEditor.getProject(this), this.labelsTextFont);

                        if (font) {
                            const fontPtr = pageRuntime.getFontPtr(font);
                            if (fontPtr) {
                                pageRuntime.wasm._lvglObjSetLocalStylePropPtr(
                                    code.objectAccessor,
                                    pageRuntime.getLvglStylePropCode(text_font_property_info.lvglStyleProp.code),
                                    fontPtr,
                                    0
                                );
                            }
                        }
                    }
                }
            }
        });

        // 段落
        if (this.sections) {
            this.sections.forEach((section, sectionIndex) => {
                code.blockStart("{");

                let sectionVar = code.callObjectFunctionWithAssignmentToStateVar(
                    section.objID,
                    "lv_scale_section_t *",
                    section.identifier ? `${section.identifier}!` : "scale_section",
                    "lv_scale_add_section"
                );

                if (section.minValueType == "literal" && section.maxValueType == "literal") {
                    code.callFreeFunction("lv_scale_section_set_range", sectionVar, section.minValue, section.maxValue);
                } else if (section.minValueType == "literal") {
                    code.callFreeFunction("lv_scale_section_set_range", sectionVar, section.minValue, -1);
                } else if (section.maxValueType == "literal") {
                    code.callFreeFunction("lv_scale_section_set_range", sectionVar, -1, section.maxValue);
                }

                if (section.minValueType == "expression" && section.maxValueType == "expression") {
                    code.addToTickMulti(
                        [
                            {
                                propertyName: `sections[${sectionIndex}].minValue`,
                                callback: () => {
                                    return code.evalIntegerProperty(
                                        "int32_t",
                                        "new_min_val",
                                        section.minValue as string,
                                        `刻度控件段落 #${sectionIndex + 1} 中最小值表达式求值失败`
                                    );
                                }
                            },
                            {
                                propertyName: `sections[${sectionIndex}].maxValue`,
                                callback: () => {
                                    return code.evalIntegerProperty(
                                        "int32_t",
                                        "new_max_val",
                                        section.maxValue as string,
                                        `刻度控件段落 #${sectionIndex + 1} 中最大值表达式求值失败`
                                    );
                                }
                            }
                        ],
                        (new_min_val: any, new_max_val: any) => {
                            //code.callObjectFunction("lv_obj_invalidate");
                            code.callFreeFunction("lv_scale_section_set_range", sectionVar, new_min_val, new_max_val);
                            //code.callObjectFunction("lv_obj_invalidate");
                        }
                    );
                } else if (section.minValueType == "expression") {
                    code.addToTick(`sections[${sectionIndex}].minValue`, () => {
                        const new_val = code.evalIntegerProperty(
                            "int32_t",
                            "new_val",
                            section.minValue as string,
                            `刻度控件段落 #${sectionIndex + 1} 中最小值表达式求值失败`
                        );
                        code.callFreeFunction("lv_scale_section_set_range", sectionVar, new_val, section.maxValue);
                        code.callObjectFunction("lv_obj_invalidate");
                    });
                } else if (section.maxValueType == "expression") {
                    code.addToTick(`sections[${sectionIndex}].maxValue`, () => {
                        const new_val = code.evalIntegerProperty(
                            "int32_t",
                            "new_val",
                            section.maxValue as string,
                            `刻度控件段落 #${sectionIndex + 1} 中最大值表达式求值失败`
                        );
                        code.callFreeFunction("lv_scale_section_set_range", sectionVar, section.minValue, new_val);
                        code.callObjectFunction("lv_obj_invalidate");
                    });
                }

                if (section.useStyle) {
                    const project = ProjectEditor.getProject(this);
                    const style = findLvglStyle(project, section.useStyle);
                    if (style) {
                        const state = "DEFAULT";
                        for (const part of ["MAIN", "INDICATOR", "ITEMS"]) {
                            if (code.lvglBuild) {
                                code.lvglBuild.assets.markLvglStyleUsed(style);
                                const definition = style.fullDefinition;
                                if (definition) {
                                    if (definition[part]?.[state]) {
                                        if (code.isLVGLVersion(["9.2.2"])) {
                                            code.callFreeFunction(
                                                "lv_scale_section_set_style",
                                                sectionVar,
                                                code.constant(`LV_PART_${part}`),
                                                `${code.lvglBuild.getGetStyleFunctionName(style, part, state)}()`
                                            );
                                        } else {
                                            code.callObjectFunction(
                                                `lv_scale_set_section_style_${part.toLowerCase()}`,
                                                sectionVar,
                                                `${code.lvglBuild.getGetStyleFunctionName(style, part, state)}()`
                                            );
                                        }                                        
                                    }
                                }
                            } else if (code.pageRuntime) {
                                const lvglStyleObjects = code.pageRuntime.styleObjMap.get(style);
                                if (lvglStyleObjects?.[part]?.[state]) {
                                    if (code.isLVGLVersion(["9.2.2"])) {
                                        code.callFreeFunction(
                                            "lv_scale_section_set_style",
                                            sectionVar,
                                            code.constant(`LV_PART_${part}`),
                                            lvglStyleObjects[part][state]
                                        );
                                    } else {
                                        code.callObjectFunction(
                                            `lv_scale_set_section_style_${part.toLowerCase()}`,
                                            sectionVar,
                                            lvglStyleObjects[part][state]
                                        );
                                    }
                                }
                            }
                        }
                    }
                }

                //
                // 段落内联样式
                //

                const getVarName = (part: string) => {
                    const scaleName = this.identifier ? this.identifier : "scale";
                    const sectionName = section.identifier ? section.identifier : "section";
                    return `${scaleName}_${sectionName}_${part}_style`;
                }

                // MAIN 部分
                const hasMainStyles =
                    section.mainWidth != undefined || section.mainColor || section.mainOpacity != undefined;

                if (hasMainStyles) {
                    let style;
                    if (code.lvglBuild) {
                        code.lvglBuild.blockStart("{");
                        const styleVar = code.lvglBuild.declareGlobalVar(
                            section.objID + "_main",
                            "lv_style_t",
                            getVarName("main"),
                            false
                        );
                        const styleInitializedVar =
                            code.lvglBuild.declareGlobalVar(
                                section.objID + "_main_initialized",
                                "bool",
                                styleVar + "_initialized!",
                                true
                            );
                        code.lvglBuild.blockStart(`if (!${styleInitializedVar}) {`);
                        code.lvglBuild.line(`lv_style_init(&${styleVar});`);
                        code.lvglBuild.line(`${styleInitializedVar} = true;`);
                        style = "&" + styleVar;
                    } else {
                        style = code.callFreeFunction("lvglStyleCreate");
                        code.pageRuntime!.pointers.push(style);
                    }

                    // mainWidth
                    if (section.mainWidth != undefined) {
                        code.callFreeFunction(`lv_style_set_${isRoundMode ? "arc" : "line"}_width`, style, section.mainWidth);
                    }

                    // mainColor
                    if (section.mainColor) {
                        code.buildColor(
                            this,
                            section.mainColor,
                            () => style,
                            color => {
                                code.callFreeFunction(`lv_style_set_${isRoundMode ? "arc" : "line"}_color`, style, code.color(color));
                            },
                            (color, obj) => {
                                if (
                                    code.lvglBuild &&
                                    code.screensLifetimeSupport
                                ) {
                                    const build = code.lvglBuild;
                                    build.line(`if (${scaleObjectAccessor}) lv_style_set_${isRoundMode ? "arc" : "line"}_color(${style}, ${code.color(color)});`);
                                } else {
                                    code.callFreeFunction(`lv_style_set_${isRoundMode ? "arc" : "line"}_color`, style, code.color(color));
                                }
                            }
                        );
                    }

                    // mainOpacity
                    if (section.mainOpacity != undefined) {
                        code.callFreeFunction(`lv_style_set_${isRoundMode ? "arc" : "line"}_opa`, style, section.mainOpacity);
                    }

                    if (code.lvglBuild) {
                        code.lvglBuild.blockEnd("}");
                    }

                    if (code.isLVGLVersion(["9.2.2"])) {
                        code.callFreeFunction("lv_scale_section_set_style", sectionVar, code.constant("LV_PART_MAIN"), style);
                    } else {
                        code.callObjectFunction("lv_scale_set_section_style_main", sectionVar, style);
                    }

                    if (code.lvglBuild) {
                        code.lvglBuild.blockEnd("}");
                    }
                }

                // ITEMS 部分（次刻度线）
                const hasItemsStyles =
                    section.minorTicksWidth != undefined ||
                    section.minorTicksColor ||
                    section.minorTicksOpacity != undefined;

                if (hasItemsStyles) {
                    let style;
                    if (code.lvglBuild) {
                        code.lvglBuild.blockStart("{");
                        const styleVar = code.lvglBuild.declareGlobalVar(
                            section.objID + "_items",
                            "lv_style_t",
                            getVarName("items"),
                            false
                        );
                        const styleInitializedVar =
                            code.lvglBuild.declareGlobalVar(
                                section.objID + "_items_initialized",
                                "bool",
                                styleVar + "_initialized!",
                                true
                            );
                        code.lvglBuild.blockStart(`if (!${styleInitializedVar}) {`);
                        code.lvglBuild.line(`lv_style_init(&${styleVar});`);
                        code.lvglBuild.line(`${styleInitializedVar} = true;`);
                        style = "&" + styleVar;
                    } else {
                        style = code.callFreeFunction("lvglStyleCreate");
                        code.pageRuntime!.pointers.push(style);
                    }

                    // minorTicksWidth
                    if (section.minorTicksWidth != undefined) {
                        code.callFreeFunction("lv_style_set_line_width", style, section.minorTicksWidth);
                    }

                    // minorTicksColor
                    if (section.minorTicksColor) {
                        code.buildColor(
                            this,
                            section.minorTicksColor,
                            () => style,
                            color => {
                                code.callFreeFunction("lv_style_set_line_color", style, code.color(color));
                            },
                            (color, obj) => {
                                if (
                                    code.lvglBuild &&
                                    code.screensLifetimeSupport
                                ) {
                                    const build = code.lvglBuild;
                                    build.line(`if (${scaleObjectAccessor}) lv_style_set_line_color(${style}, ${code.color(color)});`);
                                } else {
                                    code.callFreeFunction("lv_style_set_line_color", style, code.color(color));
                                }
                            }
                        );
                    }

                    // minorTicksOpacity
                    if (section.minorTicksOpacity != undefined) {
                        code.callFreeFunction("lv_style_set_line_opa", style, section.minorTicksOpacity);
                    }

                    if (code.lvglBuild) {
                        code.lvglBuild.blockEnd("}");
                    }

                    if (code.isLVGLVersion(["9.2.2"])) {
                        code.callFreeFunction("lv_scale_section_set_style", sectionVar, code.constant("LV_PART_ITEMS"), style);
                    } else {
                        code.callObjectFunction("lv_scale_set_section_style_items", sectionVar, style);
                    }

                    if (code.lvglBuild) {
                        code.lvglBuild.blockEnd("}");
                    }
                }

                // INDICATOR 部分（主刻度线和标签）
                const hasIndicatorStyles =
                    section.majorTicksWidth != undefined ||
                    section.majorTicksColor ||
                    section.majorTicksOpacity != undefined ||
                    section.labelsTextColor ||
                    section.labelsTextOpacity != undefined ||
                    section.labelsTextFont;

                if (hasIndicatorStyles) {
                    let style;
                    if (code.lvglBuild) {
                        code.lvglBuild.blockStart("{");
                        const styleVar = code.lvglBuild.declareGlobalVar(
                            section.objID + "_indicator",
                            "lv_style_t",
                            getVarName("indicator"),
                            false
                        );
                        const styleInitializedVar =
                            code.lvglBuild.declareGlobalVar(
                                section.objID + "_indicator_initialized",
                                "bool",
                                styleVar + "_initialized!",
                                true
                            );
                        code.lvglBuild.blockStart(`if (!${styleInitializedVar}) {`);
                        code.lvglBuild.line(`lv_style_init(&${styleVar});`);
                        code.lvglBuild.line(`${styleInitializedVar} = true;`);
                        style = "&" + styleVar;
                    } else {
                        style = code.callFreeFunction("lvglStyleCreate");
                        code.pageRuntime!.pointers.push(style);
                    }

                    // majorTicksWidth
                    if (section.majorTicksWidth != undefined) {
                        code.callFreeFunction("lv_style_set_line_width", style, section.majorTicksWidth);
                    }

                    // majorTicksColor
                    if (section.majorTicksColor) {
                        code.buildColor(
                            this,
                            section.majorTicksColor,
                            () => style,
                            color => {
                                code.callFreeFunction("lv_style_set_line_color", style, code.color(color));
                            },
                            (color, obj) => {
                                if (
                                    code.lvglBuild &&
                                    code.screensLifetimeSupport
                                ) {
                                    const build = code.lvglBuild;
                                    build.line(`if (${scaleObjectAccessor}) lv_style_set_line_color(${style}, ${code.color(color)});`);
                                } else {
                                    code.callFreeFunction("lv_style_set_line_color", style, code.color(color));
                                }
                            }
                        );
                    }

                    // majorTicksOpacity
                    if (section.majorTicksOpacity != undefined) {
                        code.callFreeFunction("lv_style_set_line_opa", style, section.majorTicksOpacity);
                    }

                    // labelsTextColor
                    if (section.labelsTextColor) {
                        code.buildColor(
                            this,
                            section.labelsTextColor,
                            () => style,
                            color => {
                                code.callFreeFunction("lv_style_set_text_color", style, code.color(color));
                            },
                            (color, obj) => {
                                if (
                                    code.lvglBuild &&
                                    code.screensLifetimeSupport
                                ) {
                                    const build = code.lvglBuild;
                                    build.line(`if (${scaleObjectAccessor}) lv_style_set_text_color(${style}, ${code.color(color)});`);
                                } else {
                                    code.callFreeFunction("lv_style_set_text_color", style, code.color(color));
                                }
                            }
                        );
                    }

                    // labelsTextOpacity
                    if (section.labelsTextOpacity != undefined) {
                        code.callFreeFunction("lv_style_set_text_opa", style, section.labelsTextOpacity);
                    }

                    // labelsTextFont
                    if (section.labelsTextFont) {
                        const fontIndex = BUILT_IN_FONTS.indexOf(section.labelsTextFont);
                        if (code.lvglBuild) {
                            if (fontIndex != -1) {
                                // 内置字体
                                code.callFreeFunction("lv_style_set_text_font", style, `&lv_font_${section.labelsTextFont.toLowerCase()}`);
                            } else {
                                // 自定义字体
                                const font = findFont(ProjectEditor.getProject(this), section.labelsTextFont);
                                if (font) {
                                    code.callFreeFunction("lv_style_set_text_font", style, code.lvglBuild.getFontAccessor(font));
                                }
                            }
                        } else {
                            const pageRuntime = code.pageRuntime!;
                            if (fontIndex != -1) {
                                pageRuntime.wasm._lvglSetObjStylePropBuiltInFont(
                                    code.objectAccessor,
                                    style,
                                    pageRuntime.getLvglStylePropCode(text_font_property_info.lvglStyleProp.code),
                                    fontIndex
                                );
                            } else {
                                const font = findFont(ProjectEditor.getProject(this), section.labelsTextFont);
                                if (font) {
                                    const fontPtr = pageRuntime.getFontPtr(font);
                                    if (fontPtr) {
                                        pageRuntime.wasm._lvglSetObjStylePropPtr(
                                            code.objectAccessor,
                                            style,
                                            pageRuntime.getLvglStylePropCode(text_font_property_info.lvglStyleProp.code),
                                            fontPtr
                                        );
                                    }
                                }
                            }
                        }
                    }

                    if (code.lvglBuild) {
                        code.lvglBuild.blockEnd("}");
                    }

                    if (code.isLVGLVersion(["9.2.2"])) {
                        code.callFreeFunction("lv_scale_section_set_style", sectionVar, code.constant("LV_PART_INDICATOR"), style);
                    } else {
                        code.callObjectFunction("lv_scale_set_section_style_indicator", sectionVar, style);
                    }

                    if (code.lvglBuild) {
                        code.lvglBuild.blockEnd("}");
                    }
                }

                code.blockEnd("}");
            });
        }
    }
}
