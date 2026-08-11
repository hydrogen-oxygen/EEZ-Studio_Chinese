// Base.tsx
import React from "react";
import { observable, makeObservable, runInAction, computed, toJS } from "mobx";
import { observer } from "mobx-react";
import { MenuItem } from "@electron/remote";

import { Rect } from "eez-studio-shared/geometry";

import { humanize } from "eez-studio-shared/string";
import { Checkbox } from "project-editor/ui-components/PropertyGrid/Checkbox";

import {
    PropertyType,
    makeDerivedClassInfo,
    IPropertyGridGroupDefinition,
    PropertyProps,
    findPropertyByNameInClassInfo,
    IEezObject,
    MessageType,
    getClassInfoLvglProperties,
    IMessage
} from "project-editor/core/object";

import {
    createObject,
    getChildOfObject,
    getClassInfo,
    getObjectPathAsString,
    getProjectStore,
    Message,
    propertyNotFoundMessage
} from "project-editor/store";

import {
    ProjectType,
    findLvglStyle,
    Project,
    NamingConvention,
    getName,
    findAction
} from "project-editor/project/project";

import type {
    IFlowContext,
    IResizeHandler
} from "project-editor/flow/flow-interfaces";

import { AutoSize, Component, Widget } from "project-editor/flow/component";
import { isTimelineEditorActive } from "project-editor/flow/timeline";

import { getComponentName } from "project-editor/flow/components/components-registry";
import { ProjectContext } from "project-editor/project/context";
import { ProjectEditor } from "project-editor/project-editor-interface";
import type {
    ICustomWidgetCreateParams,
    Page
} from "project-editor/features/page/page";
import { ComponentsContainerEnclosure } from "project-editor/flow/editor/render";
import { geometryGroup } from "project-editor/ui-components/PropertyGrid/groups";
import { Property } from "project-editor/ui-components/PropertyGrid/Property";

import { LVGLStylesDefinition } from "project-editor/lvgl/style-definition";
import { LVGLStylesDefinitionProperty } from "project-editor/lvgl/LVGLStylesDefinitionProperty";
import { LVGLPageRuntime } from "project-editor/lvgl/page-runtime";
import type { LVGLBuild } from "project-editor/lvgl/build";
import {
    getCode,
    isGeometryControlledByParent
} from "project-editor/lvgl/widget-common";

import type { LVGLCode } from "project-editor/lvgl/to-lvgl-code";

import {
    LVGLPropertyType,
    makeLvglExpressionProperty
} from "project-editor/lvgl/expression-property";
import { LVGLStyle } from "project-editor/lvgl/style";
import { showGenericDialog } from "eez-studio-ui/generic-dialog";
import { validators } from "eez-studio-shared/validation";
import {
    getLvglCoord,
    getLvglEvents,
    getLvglFlagCodes
} from "project-editor/lvgl/lvgl-versions";
import {
    LVGL_FLAG_CODES,
    LVGL_REACTIVE_FLAGS,
    LVGL_STATE_CODES,
    LVGL_STATE_CODES_V9_5_0,
    LVGL_REACTIVE_STATES
} from "project-editor/lvgl/lvgl-constants";
import { LVGLPropertyInfo } from "project-editor/lvgl/style-catalog";

import { LVGLScreenWidget } from "./internal";
import { FIT_HEIGHT_TO_CONTENT_ICON, FIT_WIDTH_TO_CONTENT_ICON, PERCENT_ICON, PX_ICON } from "project-editor/ui-components/icons";

////////////////////////////////////////////////////////////////////////////////

const generalGroup: IPropertyGridGroupDefinition = {
    id: "lvgl-general",
    title: "常规",
    position: 0
};

export const flagsGroup: IPropertyGridGroupDefinition = {
    id: "lvgl-flags",
    title: "标志",
    position: 4
};

const styleGroup: IPropertyGridGroupDefinition = {
    id: "lvgl-style",
    title: "样式",
    position: 3
};

export const statesGroup: IPropertyGridGroupDefinition = {
    id: "lvgl-states",
    title: "状态",
    position: 4
};

////////////////////////////////////////////////////////////////////////////////

function changes<T extends string>(defaults: T[], arr: T[]) {
    const added: T[] = [];
    const cleared: T[] = [];

    defaults = defaults.filter(x => x.trim() != "");
    arr = arr.filter(x => x.trim() != "");

    for (const x of arr) {
        if (defaults.indexOf(x) == -1) {
            added.push(x);
        }
    }

    for (const x of defaults) {
        if (arr.indexOf(x) == -1) {
            cleared.push(x);
        }
    }

    return {
        added,
        cleared
    };
}

////////////////////////////////////////////////////////////////////////////////

export const GeometryProperties = observer(
    class GeometryProperties extends React.Component<PropertyProps> {
        static contextType = ProjectContext;
        declare context: React.ContextType<typeof ProjectContext>;

        render() {
            const widthReadOnly =
                this.props.objects.find(
                    object => (object as any).widthUnit == "content"
                ) != undefined;

            const heightReadOnly =
                this.props.objects.find(
                    object => (object as any).heightUnit == "content"
                ) != undefined;

            return (
                <div className="EezStudio_LVGLWidgetGeometryProperty">
                    <div>X</div>
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "left"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly}
                        updateObject={this.props.updateObject}
                    />
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "leftUnit"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly}
                        updateObject={this.props.updateObject}
                    />

                    <div>Y</div>
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "top"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly}
                        updateObject={this.props.updateObject}
                    />
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "topUnit"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly}
                        updateObject={this.props.updateObject}
                    />

                    <div title="Width">W</div>
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "width"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly || widthReadOnly}
                        updateObject={this.props.updateObject}
                    />
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "widthUnit"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly}
                        updateObject={this.props.updateObject}
                    />

                    <div title="Height">H</div>
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "height"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly || heightReadOnly}
                        updateObject={this.props.updateObject}
                    />
                    <Property
                        propertyInfo={
                            findPropertyByNameInClassInfo(
                                LVGLWidget.classInfo,
                                "heightUnit"
                            )!
                        }
                        objects={this.props.objects}
                        readOnly={this.props.readOnly}
                        updateObject={this.props.updateObject}
                    />
                </div>
            );
        }
    }
);

////////////////////////////////////////////////////////////////////////////////

const LVGLWidgetFlagsProperty = observer(
    class LVGLWidgetFlagsProperty extends React.Component<PropertyProps> {
        static contextType = ProjectContext;
        declare context: React.ContextType<typeof ProjectContext>;

        render() {
            const flagNames: (keyof typeof LVGL_FLAG_CODES)[] = [];

            this.props.objects.map((widget: LVGLWidget) => {
                const flags = Object.keys(
                    getLvglFlagCodes(widget)
                ) as (keyof typeof LVGL_FLAG_CODES)[];
                for (const flagName of flags) {
                    if (
                        flagNames.indexOf(flagName) == -1 &&
                        LVGL_REACTIVE_FLAGS.indexOf(flagName) == -1
                    ) {
                        flagNames.push(flagName);
                    }
                }
            });

            return (
                <div className="EezStudio_ProjectEditor_GroupCheckboxes">
                    {flagNames.map(flagName => {
                        let values = this.props.objects.map(
                            (widget: LVGLWidget) =>
                                (widget.widgetFlags || "")
                                    .split("|")
                                    .indexOf(flagName) != -1
                        );

                        let numEnabled = 0;
                        let numDisabled = 0;
                        values.forEach(value => {
                            if (value) {
                                numEnabled++;
                            } else {
                                numDisabled++;
                            }
                        });

                        let state =
                            numEnabled == 0
                                ? false
                                : numDisabled == 0
                                ? true
                                : undefined;

                        return (
                            <Checkbox
                                key={flagName}
                                state={state}
                                label={humanize(flagName)}
                                onChange={(value: boolean) => {
                                    this.context.undoManager.setCombineCommands(
                                        true
                                    );

                                    if (value) {
                                        this.props.objects.forEach(
                                            (widget: LVGLWidget) => {
                                                const flags = Object.keys(
                                                    getLvglFlagCodes(widget)
                                                ) as (keyof typeof LVGL_FLAG_CODES)[];

                                                if (
                                                    flags.indexOf(flagName) ==
                                                    -1
                                                ) {
                                                    return;
                                                }

                                                const flagsArr =
                                                    widget.widgetFlags.trim() !=
                                                    ""
                                                        ? widget.widgetFlags.split(
                                                              "|"
                                                          )
                                                        : [];
                                                if (
                                                    flagsArr.indexOf(
                                                        flagName
                                                    ) == -1
                                                ) {
                                                    flagsArr.push(flagName);
                                                    this.context.updateObject(
                                                        widget,
                                                        {
                                                            widgetFlags:
                                                                flagsArr.join(
                                                                    "|"
                                                                )
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    } else {
                                        this.props.objects.forEach(
                                            (widget: LVGLWidget) => {
                                                const flags = Object.keys(
                                                    getLvglFlagCodes(widget)
                                                ) as (keyof typeof LVGL_FLAG_CODES)[];

                                                if (
                                                    flags.indexOf(flagName) ==
                                                    -1
                                                ) {
                                                    return;
                                                }

                                                const flagsArr = (
                                                    widget.widgetFlags || ""
                                                ).split("|");
                                                const i =
                                                    flagsArr.indexOf(flagName);
                                                if (i != -1) {
                                                    flagsArr.splice(i, 1);
                                                    this.context.updateObject(
                                                        widget,
                                                        {
                                                            widgetFlags:
                                                                flagsArr.join(
                                                                    "|"
                                                                )
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }

                                    this.context.undoManager.setCombineCommands(
                                        false
                                    );
                                }}
                                readOnly={this.props.readOnly}
                            />
                        );
                    })}
                </div>
            );
        }
    }
);

////////////////////////////////////////////////////////////////////////////////

const LVGLWidgetStatesProperty = observer(
    class LVGLWidgetStatesProperty extends React.Component<PropertyProps> {
        static contextType = ProjectContext;
        declare context: React.ContextType<typeof ProjectContext>;

        render() {
            const stateNames: (keyof typeof LVGL_STATE_CODES)[] = [];

            this.props.objects.map((widget: LVGLWidget) => {
                for (const stateName of Object.keys(
                    LVGL_STATE_CODES
                ) as (keyof typeof LVGL_STATE_CODES)[]) {
                    if (
                        stateNames.indexOf(stateName) == -1 &&
                        LVGL_REACTIVE_STATES.indexOf(stateName) == -1
                    ) {
                        stateNames.push(stateName);
                    }
                }
            });

            return (
                <div className="EezStudio_ProjectEditor_GroupCheckboxes EezStudio_ProjectEditor_GroupCheckboxes_States">
                    {stateNames.map(stateName => {
                        let values = this.props.objects.map(
                            (widget: LVGLWidget) =>
                                (widget.states || "")
                                    .split("|")
                                    .indexOf(stateName) != -1
                        );

                        let numEnabled = 0;
                        let numDisabled = 0;
                        values.forEach(value => {
                            if (value) {
                                numEnabled++;
                            } else {
                                numDisabled++;
                            }
                        });

                        let state =
                            numEnabled == 0
                                ? false
                                : numDisabled == 0
                                ? true
                                : undefined;

                        return (
                            <Checkbox
                                key={stateName}
                                state={state}
                                label={humanize(stateName)}
                                onChange={(value: boolean) => {
                                    this.context.undoManager.setCombineCommands(
                                        true
                                    );

                                    if (value) {
                                        this.props.objects.forEach(
                                            (widget: LVGLWidget) => {
                                                const statesArr =
                                                    widget.states.trim() != ""
                                                        ? widget.states.split(
                                                              "|"
                                                          )
                                                        : [];
                                                if (
                                                    statesArr.indexOf(
                                                        stateName
                                                    ) == -1
                                                ) {
                                                    statesArr.push(stateName);
                                                    this.context.updateObject(
                                                        widget,
                                                        {
                                                            states: statesArr.join(
                                                                "|"
                                                            )
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    } else {
                                        this.props.objects.forEach(
                                            (widget: LVGLWidget) => {
                                                const statesArr = (
                                                    widget.states || ""
                                                ).split("|");
                                                const i =
                                                    statesArr.indexOf(
                                                        stateName
                                                    );
                                                if (i != -1) {
                                                    statesArr.splice(i, 1);
                                                    this.context.updateObject(
                                                        widget,
                                                        {
                                                            states: statesArr.join(
                                                                "|"
                                                            )
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }

                                    this.context.undoManager.setCombineCommands(
                                        false
                                    );
                                }}
                                readOnly={this.props.readOnly}
                            />
                        );
                    })}
                </div>
            );
        }
    }
);

////////////////////////////////////////////////////////////////////////////////

function flagEnabledInWidget(
    component: Component,
    flag: keyof typeof LVGL_FLAG_CODES
) {
    const flags = Object.keys(
        getLvglFlagCodes(component)
    ) as (keyof typeof LVGL_FLAG_CODES)[];

    return component instanceof LVGLWidget && flags.indexOf(flag) != -1;
}

////////////////////////////////////////////////////////////////////////////////

export class LVGLWidget extends Widget {
    identifier: string;

    leftUnit: "px" | "%";
    topUnit: "px" | "%";
    widthUnit: "px" | "%" | "content";
    heightUnit: "px" | "%" | "content";

    children: LVGLWidget[];

    hiddenFlag: string | boolean;
    hiddenFlagType: LVGLPropertyType;
    clickableFlag: string | boolean;
    clickableFlagType: LVGLPropertyType;
    widgetFlags: string;
    flagScrollbarMode: string;
    flagScrollDirection: string;
    scrollSnapX: string;
    scrollSnapY: string;

    checkedState: string | boolean;
    checkedStateType: LVGLPropertyType;
    disabledState: string | boolean;
    disabledStateType: LVGLPropertyType;
    states: string;

    useStyle: string;
    _useStyleForStylePreview: string | undefined;
    localStyles: LVGLStylesDefinition;

    group: string;
    groupIndex: number;

    _lvglObj: number | undefined;
    _refreshRelativePosition: number = 0;

    _xScroll: number = 0;
    _yScroll: number = 0;
    _xScroll2: number = 0;
    _yScroll2: number = 0;

    _relativePosition: { left: number; top: number } | undefined;

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

    static classInfo = makeDerivedClassInfo(Widget.classInfo, {
        enabledInComponentPalette: (projectType: ProjectType) => projectType === ProjectType.LVGL,

        label: (widget: LVGLWidget) => {
            let name = getComponentName(widget.type);

            if (widget.identifier) {
                return `${name} [${widget.identifier}]`;
            }

            return name;
        },

        properties: [
            {
                name: "identifier",
                displayName: "名称",
                type: PropertyType.String,
                isOptional: true,
                propertyGridGroup: generalGroup,
                disabled: object => object instanceof LVGLScreenWidget // LVGLScreenWidget 使用页面名称作为标识符
            },
            {
                name: "codeIdentifier",
                type: PropertyType.String,
                propertyGridGroup: generalGroup,
                computed: true,
                formText: `此标识符将用于生成的源代码中的“Objects”结构体。它与上面的“名称”不同，因为在源代码中我们遵循“小写加下划线”命名约定。`,
                disabled: (object: LVGLWidget) => object.codeIdentifier == undefined
            },
            {
                name: "left",
                type: PropertyType.Number,
                propertyGridGroup: geometryGroup,
                readOnlyInPropertyGrid: isGeometryControlledByParent,
                disabled: object => object instanceof LVGLScreenWidget, // LVGLScreenWidget 从页面获取 left
                hideInPropertyGrid: true
            },
            {
                name: "leftUnit",
                type: PropertyType.Enum,
                enumItems: [
                    { id: "px", label: "像素", icon: PX_ICON },
                    { id: "%", label: "百分比", icon: PERCENT_ICON }
                ],
                enumDisallowUndefined: true,
                propertyGridGroup: geometryGroup,
                hideInPropertyGrid: true,
                disabled: object => object instanceof LVGLScreenWidget
            },
            {
                name: "top",
                type: PropertyType.Number,
                propertyGridGroup: geometryGroup,
                readOnlyInPropertyGrid: isGeometryControlledByParent,
                disabled: object => object instanceof LVGLScreenWidget,
                hideInPropertyGrid: true
            },
            {
                name: "topUnit",
                type: PropertyType.Enum,
                enumItems: [
                    { id: "px", label: "像素", icon: PX_ICON },
                    { id: "%", label: "百分比", icon: PERCENT_ICON }
                ],
                enumDisallowUndefined: true,
                propertyGridGroup: geometryGroup,
                hideInPropertyGrid: true,
                disabled: object => object instanceof LVGLScreenWidget
            },
            {
                name: "width",
                type: PropertyType.Number,
                propertyGridGroup: geometryGroup,
                readOnlyInPropertyGrid: isGeometryControlledByParent,
                disabled: object => object instanceof LVGLScreenWidget,
                hideInPropertyGrid: true
            },
            {
                name: "widthUnit",
                type: PropertyType.Enum,
                enumItems: [
                    { id: "px", label: "像素", icon: PX_ICON },
                    { id: "%", label: "百分比", icon: PERCENT_ICON },
                    { id: "content", label: "内容", icon: FIT_WIDTH_TO_CONTENT_ICON }
                ],
                enumDisallowUndefined: true,
                propertyGridGroup: geometryGroup,
                hideInPropertyGrid: true,
                disabled: object => object instanceof LVGLScreenWidget
            },
            {
                name: "height",
                type: PropertyType.Number,
                propertyGridGroup: geometryGroup,
                readOnlyInPropertyGrid: isGeometryControlledByParent,
                disabled: object => object instanceof LVGLScreenWidget,
                hideInPropertyGrid: true
            },
            {
                name: "heightUnit",
                type: PropertyType.Enum,
                enumItems: [
                    { id: "px", label: "像素", icon: PX_ICON },
                    { id: "%", label: "百分比", icon: PERCENT_ICON },
                    { id: "content", label: "内容", icon: FIT_HEIGHT_TO_CONTENT_ICON }
                ],
                enumDisallowUndefined: true,
                propertyGridGroup: geometryGroup,
                hideInPropertyGrid: true,
                disabled: object => object instanceof LVGLScreenWidget
            },
            {
                name: "geometryProperties",
                type: PropertyType.Any,
                propertyGridGroup: geometryGroup,
                computed: true,
                propertyGridRowComponent: GeometryProperties,
                skipSearch: true,
                disabled: object => object instanceof LVGLScreenWidget,
            },
            {
                name: "absolutePosition",
                displayName: "绝对位置",
                type: PropertyType.String,
                propertyGridGroup: geometryGroup,
                computed: true,
                hideInPropertyGrid: (widget: LVGLWidget) => 
                    widget instanceof LVGLScreenWidget || 
                    widget.left == widget.absolutePositionPoint.x && widget.top == widget.absolutePositionPoint.y
            },
            {
                name: "children",
                type: PropertyType.Array,
                typeClass: LVGLWidget,
                hideInPropertyGrid: true
            },
            ...makeLvglExpressionProperty("hiddenFlag", "boolean", "input", ["literal", "expression"], {
                displayName: "隐藏",
                propertyGridGroup: flagsGroup,
                disabled: (widget: LVGLWidget) => !flagEnabledInWidget(widget, "HIDDEN")
            }),
            ...makeLvglExpressionProperty("clickableFlag", "boolean", "input", ["literal", "expression"], {
                displayName: "可点击",
                propertyGridGroup: flagsGroup,
                disabled: (widget: LVGLWidget) => !flagEnabledInWidget(widget, "CLICKABLE")
            }),
            {
                name: "widgetFlags",
                type: PropertyType.String,
                propertyGridGroup: flagsGroup,
                propertyGridRowComponent: LVGLWidgetFlagsProperty,
                enumerable: false,
                hideInDocumentation: "all"
            },
            {
                name: "flagScrollbarMode",
                displayName: "滚动条模式",
                type: PropertyType.Enum,
                enumItems: [
                    {
                        id: "off",
                        label: "关闭"
                    },
                    {
                        id: "on",
                        label: "开启"
                    },
                    {
                        id: "active",
                        label: "活动"
                    },
                    {
                        id: "auto",
                        label: "自动"
                    }
                ],
                enumDisallowUndefined: false,
                propertyGridGroup: flagsGroup
            },
            {
                name: "flagScrollDirection",
                displayName: "滚动方向",
                type: PropertyType.Enum,
                enumItems: [
                    {
                        id: "none",
                        label: "无"
                    },
                    {
                        id: "top",
                        label: "上"
                    },
                    {
                        id: "left",
                        label: "左"
                    },
                    {
                        id: "bottom",
                        label: "下"
                    },
                    {
                        id: "right",
                        label: "右"
                    },
                    {
                        id: "hor",
                        label: "水平"
                    },
                    {
                        id: "ver",
                        label: "垂直"
                    },
                    {
                        id: "all",
                        label: "全部"
                    }
                ],
                enumDisallowUndefined: false,
                propertyGridGroup: flagsGroup
            },
            {
                name: "scrollSnapX",
                displayName: "滚动吸附 X",
                type: PropertyType.Enum,
                enumItems: [
                    {
                        id: "none",
                        label: "无"
                    },
                    {
                        id: "start",
                        label: "起始"
                    },
                    {
                        id: "end",
                        label: "结束"
                    },
                    {
                        id: "center",
                        label: "居中"
                    }
                ],
                enumDisallowUndefined: false,
                propertyGridGroup: flagsGroup
            },
            {
                name: "scrollSnapY",
                displayName: "滚动吸附 Y",
                type: PropertyType.Enum,
                enumItems: [
                    {
                        id: "none",
                        label: "无"
                    },
                    {
                        id: "start",
                        label: "起始"
                    },
                    {
                        id: "end",
                        label: "结束"
                    },
                    {
                        id: "center",
                        label: "居中"
                    }
                ],
                enumDisallowUndefined: false,
                propertyGridGroup: flagsGroup
            },
            ...makeLvglExpressionProperty("checkedState", "boolean", "assignable", ["literal", "expression"], {
                displayName: "已选中",
                propertyGridGroup: statesGroup
            }),
            ...makeLvglExpressionProperty("disabledState", "boolean", "input", ["literal", "expression"], {
                displayName: "禁用",
                propertyGridGroup: statesGroup
            }),
            {
                name: "states",
                type: PropertyType.String,
                propertyGridGroup: statesGroup,
                propertyGridRowComponent: LVGLWidgetStatesProperty,
                enumerable: false
            },
            {
                name: "useStyle",
                type: PropertyType.ObjectReference,
                referencedObjectCollectionPath: "allLvglStyles",
                filterReferencedObjectCollection: (objects: IEezObject[], lvglStyle: LVGLStyle) =>
                    objects.length == 1 &&
                    objects[0] instanceof LVGLWidget &&
                    lvglStyle.forWidgetType == objects[0].type &&
                    ProjectEditor.getProject(lvglStyle).lvglStyles.defaultStyles[lvglStyle.forWidgetType] !=
                        lvglStyle.name,
                propertyGridGroup: styleGroup,
                inputPlaceholder: (widget: LVGLWidget) => {
                    return ProjectEditor.getProject(widget).lvglStyles.defaultStyles[widget.type] ?? undefined;
                },
                propertyMenu: (props: PropertyProps): Electron.MenuItem[] => {
                    let menuItems: Electron.MenuItem[] = [];

                    if (props.objects.length === 1) {
                        const widget = props.objects[0] as LVGLWidget;

                        if (widget.localStyles.hasModifications) {
                            menuItems.push(
                                new MenuItem({
                                    label: "重置所有修改",
                                    click: () => {
                                        widget.localStyles.resetAllModifications();
                                    }
                                })
                            );

                            menuItems.push(
                                new MenuItem({
                                    label: "创建新样式",
                                    click: async () => {
                                        const projectStore = getProjectStore(widget);

                                        const result = await showGenericDialog({
                                            dialogDefinition: {
                                                title: "新样式",
                                                fields: [
                                                    {
                                                        name: "name",
                                                        type: "string",
                                                        validators: [
                                                            validators.required,
                                                            validators.unique(
                                                                {},
                                                                projectStore.project.lvglStyles.allStyles
                                                            )
                                                        ]
                                                    }
                                                ]
                                            },
                                            values: {}
                                        });

                                        projectStore.undoManager.setCombineCommands(true);

                                        let styleParent = projectStore.project.lvglStyles.styles;

                                        if (widget.useStyle) {
                                            const lvglStyle = findLvglStyle(projectStore.project, widget.useStyle);

                                            if (lvglStyle && lvglStyle.forWidgetType == widget.type) {
                                                styleParent = lvglStyle.childStyles;
                                            }
                                        }

                                        projectStore.addObject(
                                            styleParent,
                                            createObject<LVGLStyle>(
                                                projectStore,
                                                {
                                                    name: result.values.name,
                                                    forWidgetType: widget.type,
                                                    definition: createObject<LVGLStylesDefinition>(
                                                        projectStore,
                                                        {
                                                            definition: toJS(widget.localStyles.definition)
                                                        },
                                                        LVGLStylesDefinition
                                                    )
                                                },
                                                LVGLStyle
                                            )
                                        );

                                        projectStore.updateObject(widget, {
                                            useStyle: result.values.name
                                        });

                                        projectStore.updateObject(widget.localStyles, {
                                            definition: undefined
                                        });

                                        projectStore.undoManager.setCombineCommands(false);
                                    }
                                })
                            );

                            if (widget.useStyle) {
                                menuItems.push(
                                    new MenuItem({
                                        label: "更新样式",
                                        click: async () => {
                                            const projectStore = getProjectStore(widget);

                                            const lvglStyle = findLvglStyle(projectStore.project, widget.useStyle);

                                            if (lvglStyle) {
                                                projectStore.undoManager.setCombineCommands(true);

                                                projectStore.updateObject(lvglStyle.definition, {
                                                    definition: LVGLStylesDefinition.combineDefinitions(
                                                        lvglStyle.definition.definition,
                                                        widget.localStyles.definition
                                                    )
                                                });

                                                projectStore.updateObject(widget.localStyles, {
                                                    definition: undefined
                                                });

                                                projectStore.undoManager.setCombineCommands(false);
                                            }
                                        }
                                    })
                                );
                            }
                        }
                    }

                    return menuItems;
                }
            },
            {
                name: "localStyles",
                type: PropertyType.Object,
                typeClass: LVGLStylesDefinition,
                propertyGridGroup: styleGroup,
                propertyGridCollapsable: true,
                propertyGridRowComponent: LVGLStylesDefinitionProperty,
                enumerable: false
            },
            {
                name: "group",
                type: PropertyType.ObjectReference,
                referencedObjectCollectionPath: "lvglGroups/groups",
                propertyGridGroup: generalGroup,
                hideInPropertyGrid: (widget: LVGLWidget) =>
                    (ProjectEditor.getProject(widget).lvglGroups.groups.length == 0 && !widget.group) ||
                    widget instanceof LVGLScreenWidget
            },
            {
                name: "groupIndex",
                type: PropertyType.Number,
                propertyGridGroup: generalGroup,
                hideInPropertyGrid: (widget: LVGLWidget) => !widget.group
            }
        ],

        beforeLoadHook: (widget: LVGLWidget, jsWidget: Partial<LVGLWidget>, project: Project) => {
            // 迁移至低分辨率
            if ((window as any).__eezProjectMigration) {
                jsWidget.left = Math.floor(
                    (jsWidget.left! * __eezProjectMigration.displayTargetWidth) /
                        __eezProjectMigration.displaySourceWidth
                );
                jsWidget.top = Math.floor(
                    (jsWidget.top! * __eezProjectMigration.displayTargetHeight) /
                        __eezProjectMigration.displaySourceHeight
                );
                jsWidget.width = Math.floor(
                    (jsWidget.width! * __eezProjectMigration.displayTargetWidth) /
                        __eezProjectMigration.displaySourceWidth
                );
                jsWidget.height = Math.floor(
                    (jsWidget.height! * __eezProjectMigration.displayTargetHeight) /
                        __eezProjectMigration.displaySourceHeight
                );
            }

            if (jsWidget.leftUnit == undefined) {
                jsWidget.leftUnit = "px";
            }
            if (jsWidget.topUnit == undefined) {
                jsWidget.topUnit = "px";
            }
            if (jsWidget.widthUnit == undefined) {
                jsWidget.widthUnit = "px";
            }
            if (jsWidget.heightUnit == undefined) {
                jsWidget.heightUnit = "px";
            }

            // 迁移状态
            if ((jsWidget as any).states != undefined) {
                const states = (jsWidget as any).states.split("|") as (keyof typeof LVGL_STATE_CODES)[];

                states.forEach(state => {
                    if (LVGL_REACTIVE_STATES.indexOf(state) != -1) {
                        const propName = state.toLowerCase() + "State";
                        (jsWidget as any)[propName] = true;
                        (jsWidget as any)[propName + "Type"] = "literal";
                    }
                });

                (jsWidget as any).states = states.filter(state => LVGL_REACTIVE_STATES.indexOf(state) == -1).join("|");
            } else {
                (jsWidget as any).states = "";
            }

            LVGL_REACTIVE_STATES.forEach(state => {
                const propName = state.toLowerCase() + "State";
                if ((jsWidget as any)[propName + "Type"] == undefined) {
                    (jsWidget as any)[propName + "Type"] = "literal";
                }
            });

            // 迁移标志
            if ((jsWidget as any).flags != undefined) {
                const flags = (jsWidget as any).flags.split("|") as (keyof typeof LVGL_FLAG_CODES)[];

                flags.forEach(flag => {
                    if (LVGL_REACTIVE_FLAGS.indexOf(flag) != -1) {
                        const propName = flag.toLowerCase() + "Flag";
                        (jsWidget as any)[propName] = true;
                        (jsWidget as any)[propName + "Type"] = "literal";
                    }
                });

                (jsWidget as any).flags = flags.filter(flag => LVGL_REACTIVE_FLAGS.indexOf(flag) == -1).join("|");

                const classInfo = getClassInfo(widget);

                let lvgl;
                if (typeof classInfo.lvgl == "function") {
                    lvgl = classInfo.lvgl(widget, project);
                } else {
                    lvgl = classInfo.lvgl!;
                }

                if (lvgl.oldInitFlags && lvgl.oldDefaultFlags) {
                    if ((jsWidget as any).flags == lvgl.oldInitFlags) {
                        (jsWidget as any).flags = lvgl.defaultFlags;
                    } else {
                        const defaultFlagsArr = lvgl.defaultFlags.split("|");
                        const oldDefaultFlagsArr = lvgl.oldDefaultFlags.split("|");

                        const i = oldDefaultFlagsArr.indexOf("SCROLL_CHAIN");
                        if (i != -1) {
                            oldDefaultFlagsArr.splice(i, 1);
                            oldDefaultFlagsArr.push("SCROLL_CHAIN_HOR");
                            oldDefaultFlagsArr.push("SCROLL_CHAIN_VER");
                        }

                        for (const flag of defaultFlagsArr) {
                            if (flag != "CLICKABLE" && oldDefaultFlagsArr.indexOf(flag) == -1) {
                                if (!(jsWidget as any).flags) {
                                    (jsWidget as any).flags = flag;
                                } else {
                                    if ((jsWidget as any).flags.indexOf(flag) == -1) {
                                        (jsWidget as any).flags += "|" + flag;
                                    }
                                }
                            }
                        }
                    }
                }

                (jsWidget as any).widgetFlags = (jsWidget as any).flags;
                delete (jsWidget as any).flags;
            } else if ((jsWidget as any).widgetFlags == undefined) {
                (jsWidget as any).widgetFlags = "";
            }

            LVGL_REACTIVE_FLAGS.forEach(flag => {
                const propName = flag.toLowerCase() + "Flag";
                if ((jsWidget as any)[propName + "Type"] == undefined) {
                    (jsWidget as any)[propName + "Type"] = "literal";
                }
            });

            if (jsWidget.groupIndex == undefined) {
                jsWidget.groupIndex = 0;
            }
        },

        defaultValue: {
            left: 0,
            top: 0,
            width: 100,
            height: 32,
            leftUnit: "px",
            topUnit: "px",
            widthUnit: "px",
            heightUnit: "px",
            flagScrollbarMode: "",
            flagScrollDirection: "",
            scrollSnapX: "",
            scrollSnapY: "",
            hiddenFlagType: "literal",
            clickableFlagType: "literal",
            checkedStateType: "literal",
            disabledStateType: "literal",
            group: "",
            groupIndex: 0
        },

        setRect: (widget: LVGLWidget, value: Partial<Rect>) => {
            const projectStore = getProjectStore(widget);

            const props: Partial<Rect> = {};

            const { left, top } = widget.fromRelativePosition(
                value.left ?? widget.rect.left,
                value.top ?? widget.rect.top
            );

            if (widget.leftUnit == "px" && left !== widget.left) {
                props.left = left;
            }

            if (widget.topUnit == "px" && top !== widget.top) {
                props.top = top;
            }

            const width = value.width ?? widget.rect.width;
            const height = value.height ?? widget.rect.height;

            if (widget.widthUnit == "px" && !(widget.autoSize == "width" || widget.autoSize == "both")) {
                if (width !== widget.width) {
                    props.width = width;
                }
            }

            if (widget.heightUnit == "px" && !(widget.autoSize == "height" || widget.autoSize == "both")) {
                if (height !== widget.height) {
                    props.height = height;
                }
            }

            projectStore.updateObject(widget, props);
        },

        check: (widget: LVGLWidget, messages: IMessage[]) => {
            const projectStore = getProjectStore(widget);

            if (widget.identifier) {
                const lvglIdentifier = projectStore.lvglIdentifiers.getIdentifier(widget);

                if (lvglIdentifier && lvglIdentifier.widgets.length > 1) {
                    messages.push(
                        new Message(MessageType.ERROR, `重复的标识符`, getChildOfObject(widget, "identifier"))
                    );
                }
            }

            if (widget.useStyle) {
                const lvglStyle = findLvglStyle(projectStore.project, widget.useStyle);
                if (!lvglStyle) {
                    messages.push(propertyNotFoundMessage(widget, "useStyle"));
                } else if (widget.type != lvglStyle.forWidgetType) {
                    messages.push(
                        new Message(
                            MessageType.ERROR,
                            `样式“${widget.useStyle}”不适用于此控件类型`,
                            getChildOfObject(widget, "useStyle")
                        )
                    );
                }
            }

            if (widget.group && !projectStore.project.lvglGroups.groups.find(group => group.name == widget.group)) {
                messages.push(propertyNotFoundMessage(widget, "group"));
            }

            widget.localStyles.check(messages);
        },

        showTreeCollapseIcon: "has-children",

        widgetEvents: (widget: LVGLWidget) => getLvglEvents(widget)
    });

    constructor() {
        super();

        makeObservable(this, {
            allStates: computed,
            relativePosition: computed,
            componentWidth: computed,
            componentHeight: computed
        });
    }

    override makeEditable() {
        super.makeEditable();

        makeObservable(this, {
            identifier: observable,
            leftUnit: observable,
            topUnit: observable,
            widthUnit: observable,
            heightUnit: observable,
            children: observable,
            widgetFlags: observable,
            hiddenFlag: observable,
            hiddenFlagType: observable,
            clickableFlag: observable,
            clickableFlagType: observable,
            flagScrollbarMode: observable,
            flagScrollDirection: observable,
            scrollSnapX: observable,
            scrollSnapY: observable,
            checkedState: observable,
            checkedStateType: observable,
            disabledState: observable,
            disabledStateType: observable,
            states: observable,
            useStyle: observable,
            localStyles: observable,
            group: observable,
            groupIndex: observable,
            _lvglObj: observable,
            _refreshRelativePosition: observable,
            _xScroll: observable,
            _yScroll: observable
        });
    }

    get rect(): Rect {
        return {
            left: this.relativePosition.left,
            top: this.relativePosition.top,
            width: this.componentWidth,
            height: this.componentHeight
        };
    }

    override get relativePosition() {
        this._refreshRelativePosition;

        if (this._lvglObj) {
            const page = ProjectEditor.getPage(this) as Page;
            if (page._lvglRuntime && page._lvglRuntime.isMounted) {
                try {
                    this._relativePosition = {
                        left: page._lvglRuntime.wasm._lvglGetObjRelX(this._lvglObj),
                        top: page._lvglRuntime.wasm._lvglGetObjRelY(this._lvglObj)
                    };
                } catch (e) {}
            }
        }

        return this._relativePosition || super.relativePosition;
    }

    override fromRelativePosition(left: number, top: number) {
        if (this._lvglObj) {
            const page = ProjectEditor.getPage(this) as Page;
            if (page._lvglRuntime && page._lvglRuntime.isMounted) {
                return {
                    left: Math.round(left - this.relativePosition.left + this.left),
                    top: Math.round(top - this.relativePosition.top + this.top)
                };
            }
        }

        return { left, top };
    }

    override get autoSize(): AutoSize {
        if (this.widthUnit == "content" && this.heightUnit == "content") {
            return "both";
        }
        if (this.widthUnit == "content") {
            return "width";
        }
        if (this.heightUnit == "content") {
            return "height";
        }
        return "none";
    }

    override get componentWidth() {
        if (this._lvglObj) {
            const page = ProjectEditor.getPage(this);
            if (page._lvglRuntime && page._lvglRuntime.isMounted) {
                return page._lvglRuntime.wasm._lvglGetObjWidth(this._lvglObj);
            }
        }
        return this.width ?? 0;
    }

    override get componentHeight() {
        if (this._lvglObj) {
            const page = ProjectEditor.getPage(this);
            if (page._lvglRuntime && page._lvglRuntime.isMounted) {
                return page._lvglRuntime.wasm._lvglGetObjHeight(this._lvglObj);
            }
        }
        return this.height ?? 0;
    }

    override getResizeHandlers(): IResizeHandler[] | undefined | false {
        if (isTimelineEditorActive(this)) {
            return [];
        }

        if (this.widthUnit != "px" && this.heightUnit != "px") {
            return [];
        }

        if (this.widthUnit != "px") {
            return [
                {
                    x: 50,
                    y: 0,
                    type: "n-resize"
                },
                {
                    x: 50,
                    y: 100,
                    type: "s-resize"
                }
            ];
        }

        if (this.heightUnit != "px") {
            return [
                {
                    x: 0,
                    y: 50,
                    type: "w-resize"
                },
                {
                    x: 100,
                    y: 50,
                    type: "e-resize"
                }
            ];
        }

        return super.getResizeHandlers();
    }

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    get allStates() {
        const states = this.states.split("|") as (keyof typeof LVGL_STATE_CODES)[];

        LVGL_REACTIVE_STATES.forEach(state => {
            const propName = state.toLowerCase() + "State";

            if ((this as any)[propName + "Type"] == "literal") {
                if ((this as any)[propName]) {
                    if (states.indexOf(state) == -1) {
                        states.push(state);
                    }
                }
            }
        });

        return states.filter(state => state.trim() != "").join("|");
    }

    get allFlags() {
        const flags =
            this.widgetFlags.trim() != "" ? (this.widgetFlags.split("|") as (keyof typeof LVGL_FLAG_CODES)[]) : [];

        LVGL_REACTIVE_FLAGS.forEach(flag => {
            const propName = flag.toLowerCase() + "Flag";

            if ((this as any)[propName + "Type"] == "literal") {
                if ((this as any)[propName]) {
                    if (flags.indexOf(flag) == -1) {
                        flags.push(flag);
                    }
                }
            } else {
                const lvglClassInfoProperties = getClassInfoLvglProperties(this);
                if (flag in (lvglClassInfoProperties.defaultFlags ?? "").split("|")) {
                    if (flags.indexOf(flag) == -1) {
                        flags.push(flag);
                    }
                }
            }
        });

        return flags.join("|");
    }

    get styleTemplate() {
        if (this._useStyleForStylePreview) {
            return undefined;
        }
        if (this.useStyle) {
            return this.useStyle;
        }
        return ProjectEditor.getProject(this).lvglStyles.defaultStyles[this.type];
    }

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    override lvglCreate(runtime: LVGLPageRuntime, parentObj: number, customWidget?: ICustomWidgetCreateParams) {
        const code = runtime.toLVGLCode;
        code.startWidget(this, parentObj, customWidget);
        this.toLVGLCode(code);

        code.widget = this;
        code.parentObj = parentObj;
        code.customWidget = customWidget;
        code.buildColorParams = undefined;        

        const obj = code.obj;
        if (!runtime.isInsideUserWidget) {
            runInAction(() => (this._lvglObj = obj));
        }

        this.toLVGLCodeCommon(code);

        // 组
        if (this.group) {
            runtime.registerGroupWidget(this.group, this.groupIndex, obj);
        }

        // 时间线
        for (const keyframe of this.timeline) {
            keyframe.lvglCreate(runtime, obj, runtime.lvglCreateContext.flowState);
        }

        // 子控件
        this.children.map((widget: LVGLWidget) => widget.lvglCreate(runtime, obj));

        if (runtime.isEditor) {
            runtime.wasm._lvglScrollTo(obj, this._xScroll, this._yScroll, false);

            this._xScroll2 = runtime.wasm._lvglGetScrollX(obj);
            this._yScroll2 = runtime.wasm._lvglGetScrollY(obj);
        }

        return obj;
    }

    getLvglCreateRect() {
        if (this instanceof LVGLScreenWidget) {
            const page = ProjectEditor.getPage(this);
            return page.rect;
        }

        const { LV_SIZE_CONTENT, LV_PCT } = getLvglCoord(this);

        let left = this.leftUnit == "%" ? LV_PCT(this.left) : this.left;
        let top = this.topUnit == "%" ? LV_PCT(this.top) : this.top;
        let width = this.widthUnit == "content" ? LV_SIZE_CONTENT : this.widthUnit == "%" ? LV_PCT(this.width) : this.width;
        let height = this.heightUnit == "content" ? LV_SIZE_CONTENT : this.heightUnit == "%" ? LV_PCT(this.height) : this.height;

        return { left, top, width, height };
    }

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    lvglBuild(build: LVGLBuild): void {
        if (this.identifier) {
            build.line(`// ${this.identifier}`);
        }

        const code = build.toLVGLCode;
        code.startWidget(this);
        this.toLVGLCode(code);

        this.toLVGLCodeCommon(code);

        // 子控件
        if (this.children.length > 0) {
            build.blockStart("{");
            build.line("lv_obj_t *parent_obj = obj;");

            for (const widget of this.children) {
                build.blockStart("{");
                widget.lvglBuild(build);
                build.blockEnd("}");
            }

            build.blockEnd("}");
        }
    }

    getLvglBuildRect() {
        let left = this.leftUnit == "%" ? `LV_PCT(${Math.round(this.left)})` : Math.round(this.left);
        let top = this.topUnit == "%" ? `LV_PCT(${Math.round(this.top)})` : Math.round(this.top);
        let width = this.widthUnit == "content" ? "LV_SIZE_CONTENT" : this.widthUnit == "%" ? `LV_PCT(${Math.round(this.width)})` : Math.round(this.width);
        let height = this.heightUnit == "content" ? "LV_SIZE_CONTENT" : this.heightUnit == "%" ? `LV_PCT(${Math.round(this.height)})` : Math.round(this.height);
        return { left, top, width, height };
    }

    buildStyleIfNotDefined(build: LVGLBuild, propertyInfo: LVGLPropertyInfo) {
        if (this.localStyles.getPropertyValue(propertyInfo, "MAIN", "DEFAULT") == undefined) {
            build.line(
                `lv_obj_set_style_${build.getStylePropName(
                    propertyInfo.name
                )}(obj, 0, LV_PART_MAIN | LV_STATE_DEFAULT);`
            );
        }
    }

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    toLVGLCode(code: LVGLCode) {
        console.error("意外！");
    }

    toLVGLCodeCommon(code: LVGLCode) {
        // 事件处理器
        this.eventHandlersToLVGLCode(code);
        // 添加/清除标志
        this.flagsToCode(code);
        // 添加/清除状态
        this.statesToCode(code);
        // 样式
        this.stylesToCode(code);
        //
        code.endWidget();
    }

    eventHandlersToLVGLCode(code: LVGLCode) {
        let addEventAllCallback = code.lvglBuild ? code.lvglBuild.eventHandlers.get(this) : false;

        if (this.checkedStateType == "expression") {
            code.addEventHandler("VALUE_CHANGED", (event, tick_value_change_obj) => {
                const ta = code.callFreeFunctionWithAssignment("lv_obj_t *", "ta", code.lv_event_get_target, event);
                code.ifNotEqual(tick_value_change_obj, ta, () => {
                    const value = code.callFreeFunctionWithAssignment(
                        "bool",
                        "value",
                        "lv_obj_has_state",
                        ta,
                        code.constant("LV_STATE_CHECKED")
                    );
                    code.assignBooleanProperty(
                        "checkedState",
                        this.checkedState as string,
                        value,
                        "给已选中状态属性赋值失败"
                    );
                });
            });

            addEventAllCallback = true;
        }

        this.eventHandlers.forEach(eventHandler => {
            const checkedOrUncheckedEvent =
                eventHandler.eventName == "CHECKED" || eventHandler.eventName == "UNCHECKED";

            if (code.hasFlowSupport || checkedOrUncheckedEvent) {
                code.addEventHandler(eventHandler.eventName, (event, tick_value_change_obj) => {
                    const callback = () => {
                        if (eventHandler.handlerType == "flow") {
                            let componentIndex;
                            let outputIndex;

                            // 构建特定
                            if (code.lvglBuild) {
                                componentIndex = code.lvglBuild.assets.getComponentIndex(this);
                                outputIndex = code.lvglBuild.assets.getComponentOutputIndex(
                                    this,
                                    eventHandler.eventName
                                );
                            } else {
                                const page = ProjectEditor.getPage(this);
                                const pagePath = getObjectPathAsString(page);
                                const flowIndex = code.pageRuntime!.wasm.assetsMap.flowIndexes[pagePath];
                                if (flowIndex != undefined) {
                                    const flow = code.pageRuntime!.wasm.assetsMap.flows[flowIndex];
                                    const componentPath = getObjectPathAsString(this);
                                    componentIndex = flow.componentIndexes[componentPath];
                                    if (componentIndex != undefined) {
                                        const component = flow.components[componentIndex];
                                        outputIndex = component.outputIndexes[eventHandler.eventName];
                                    }
                                }
                            }

                            if (componentIndex != undefined && outputIndex != undefined) {
                                if (code.lvglBuild) {
                                    code.lvglBuild.line(`e->user_data = (void *)${eventHandler.userData};`);
                                } else {
                                    code.callFreeFunction("lvglSetEventUserData", event, eventHandler.userData);
                                }
                                code.callFreeFunction(
                                    "flowPropagateValueLVGLEvent",
                                    code.flowState,
                                    componentIndex,
                                    outputIndex,
                                    event
                                );
                            }
                        } else {
                            const action = findAction(code.project, eventHandler.action);
                            if (action) {
                                if (action.implementationType == "native" || !code.hasFlowSupport) {
                                    // 构建特定
                                    if (code.lvglBuild) {
                                        if (code.lvglBuild && code.hasFlowSupport) {
                                            code.lvglBuild.line(`e->user_data = (void *)${eventHandler.userData};`);
                                        }
                                        code.lvglBuild.line(
                                            `${code.lvglBuild.getActionFunctionName(eventHandler.action)}(e);`
                                        );
                                    } else {
                                        //
                                    }
                                } else {
                                    let actionFlowIndex;

                                    if (code.lvglBuild) {
                                        actionFlowIndex = code.lvglBuild.assets.getFlowIndex(action);
                                    } else {
                                        const actionPath = getObjectPathAsString(action);
                                        actionFlowIndex = code.pageRuntime!.wasm.assetsMap.flowIndexes[actionPath];
                                    }

                                    if (actionFlowIndex != undefined) {
                                        if (code.lvglBuild) {
                                            code.lvglBuild.line(`e->user_data = (void *)${eventHandler.userData};`);
                                        } else {
                                            code.callFreeFunction("lvglSetEventUserData", event, eventHandler.userData);
                                        }
                                        code.callFreeFunction(
                                            "flowPropagateValueLVGLEvent",
                                            code.flowState,
                                            -1,
                                            actionFlowIndex,
                                            event
                                        );
                                    }
                                }
                            }
                        }
                    };

                    if (eventHandler.eventName == "CHECKED") {
                        code.if(
                            code.callFreeFunctionInline(
                                "lv_obj_has_state",
                                code.callFreeFunctionInline(code.lv_event_get_target, event),
                                code.constant("LV_STATE_CHECKED")
                            ),
                            callback
                        );
                    } else if (eventHandler.eventName == "UNCHECKED") {
                        code.ifNot(
                            code.callFreeFunctionInline(
                                "lv_obj_has_state",
                                code.callFreeFunctionInline(code.lv_event_get_target, event),
                                code.constant("LV_STATE_CHECKED")
                            ),
                            callback
                        );
                    } else {
                        callback();
                    }
                });
            }

            if (code.lvglBuild) {
                if (!code.hasFlowSupport) {
                    code.lvglBuild.line(
                        `lv_obj_add_event_cb(obj, ${
                            eventHandler.eventName == "CHECKED"
                                ? code.lvglBuild.getCheckedEventHandlerCallbackName(this)
                                : eventHandler.eventName == "UNCHECKED"
                                  ? code.lvglBuild.getUncheckedEventHandlerCallbackName(this)
                                  : code.lvglBuild.getActionFunctionName(eventHandler.action)
                        }, LV_EVENT_${checkedOrUncheckedEvent ? "VALUE_CHANGED" : eventHandler.eventName}, (void *)${eventHandler.userData});`
                    );
                } else {
                    addEventAllCallback = true;
                }
            }
        });

        if (code.lvglBuild && addEventAllCallback) {
            code.lvglBuild.line(
                `lv_obj_add_event_cb(obj, ${code.lvglBuild.getEventHandlerCallbackName(
                    this
                )}, LV_EVENT_ALL, ${code.hasFlowSupport ? "flowState" : "0"});`
            );
        }
    }

    flagsToCode(code: LVGLCode) {
        const lvglClassInfoProperties = getClassInfoLvglProperties(this);

        const { added, cleared } = changes(
            lvglClassInfoProperties.defaultFlags.trim() != ""
                ? lvglClassInfoProperties.defaultFlags.split("|")
                : [],
            this.allFlags.trim() != "" ? (this.allFlags.split("|") as (keyof typeof LVGL_FLAG_CODES)[]) : []
        );
     
        if (added.length > 0) {
            let flags;
            if (code.lvglBuild) {
                flags = added.map(flag => "LV_OBJ_FLAG_" + flag).join("|");
            } else {
                flags = getCode(added, getLvglFlagCodes(this));
            }
            code.callObjectFunction("lv_obj_add_flag", flags);
        }
        if (cleared.length > 0) {
            let flags;
            if (code.lvglBuild) {
                flags = cleared.map(flag => "LV_OBJ_FLAG_" + flag).join("|");
            } else {
                flags = getCode(cleared, getLvglFlagCodes(this));
            }            
            code.callObjectFunction(code.isV9 ? "lv_obj_remove_flag" : "lv_obj_clear_flag", flags);
        }

        if (this.hiddenFlagType == "expression") {
            code.addToTick("hiddenFlag", () => {

                const new_val = code.evalBooleanProperty(
                    "bool",
                    "new_val",
                    this.hiddenFlag as string,
                    "隐藏标志表达式求值失败"
                );

                const cur_val = code.callObjectFunctionWithAssignment(
                    "bool",
                    "cur_val",
                    "lv_obj_has_flag",
                    code.constant("LV_OBJ_FLAG_HIDDEN")
                );

                code.ifNotEqual(new_val, cur_val, () => {
                    code.tickChangeStart();

                    code.if(new_val, () => {
                        code.callObjectFunction("lv_obj_add_flag", code.constant("LV_OBJ_FLAG_HIDDEN"));
                    }, () => {
                        code.callObjectFunction(code.isV9 ? "lv_obj_remove_flag" : "lv_obj_clear_flag", code.constant("LV_OBJ_FLAG_HIDDEN"));
                    });

                    code.tickChangeEnd();
                });
            });
        }

        if (this.clickableFlagType == "expression") {
            code.addToTick("clickableFlag", () => {

                const new_val = code.evalBooleanProperty(
                    "bool",
                    "new_val",
                    this.clickableFlag as string,
                    "可点击标志表达式求值失败"
                );

                const cur_val = code.callObjectFunctionWithAssignment(
                    "bool",
                    "cur_val",
                    "lv_obj_has_flag",
                    code.constant("LV_OBJ_FLAG_CLICKABLE")
                );

                code.ifNotEqual(new_val, cur_val, () => {
                    code.tickChangeStart();

                    code.if(new_val, () => {
                        code.callObjectFunction("lv_obj_add_flag", code.constant("LV_OBJ_FLAG_CLICKABLE"));
                    }, () => {
                        code.callObjectFunction(code.isV9 ? "lv_obj_remove_flag" : "lv_obj_clear_flag", code.constant("LV_OBJ_FLAG_CLICKABLE"));
                    });

                    code.tickChangeEnd();
                });
            });
        }

        if (this.flagScrollbarMode) {
            code.callObjectFunction("lv_obj_set_scrollbar_mode", code.constant(`LV_SCROLLBAR_MODE_${this.flagScrollbarMode.toUpperCase()}`));
        }

        if (this.flagScrollDirection) {
            code.callObjectFunction("lv_obj_set_scroll_dir", code.constant(`LV_DIR_${this.flagScrollDirection.toUpperCase()}`));
        }

        if (this.scrollSnapX) {
            code.callObjectFunction("lv_obj_set_scroll_snap_x", code.constant(`LV_SCROLL_SNAP_${this.scrollSnapX.toUpperCase()}`));
        }

        if (this.scrollSnapY) {
            code.callObjectFunction("lv_obj_set_scroll_snap_y", code.constant(`LV_SCROLL_SNAP_${this.scrollSnapY.toUpperCase()}`));
        }            

        if (code.pageRuntime) {
            if (this.hiddenInEditor && code.pageRuntime.isEditor) {
                code.callObjectFunction("lv_obj_add_flag", code.constant("LV_OBJ_FLAG_HIDDEN"));
            }
        }
    }

    statesToCode(code: LVGLCode) {
        const added =
            this.allStates.trim() != "" ? (this.allStates.split("|") as (keyof typeof LVGL_STATE_CODES)[]) : [];

        if (added.length > 0) {
            let states;
            if (code.lvglBuild) {
                states = added.map(state => "LV_STATE_" + state).join("|");
            } else {
                states = getCode(added, code.isLVGLVersion(["9.5.0"]) ? LVGL_STATE_CODES_V9_5_0 : LVGL_STATE_CODES);
            }            
            code.callObjectFunction("lv_obj_add_state", states);
        }

        if (this.checkedStateType == "expression") {
            code.addToTick("checkedState", () => {

                const new_val = code.evalBooleanProperty(
                    "bool",
                    "new_val",
                    this.checkedState as string,
                    "已选中状态表达式求值失败"
                );

                const cur_val = code.callObjectFunctionWithAssignment(
                    "bool",
                    "cur_val",
                    "lv_obj_has_state",
                    code.constant("LV_STATE_CHECKED")
                );

                code.ifNotEqual(new_val, cur_val, () => {
                    code.tickChangeStart();

                    code.if(new_val, () => {
                        code.callObjectFunction("lv_obj_add_state", code.constant("LV_STATE_CHECKED"));
                    }, () => {
                        code.callObjectFunction(code.isV9 ? "lv_obj_remove_state" : "lv_obj_clear_state", code.constant("LV_STATE_CHECKED"));
                    });

                    code.tickChangeEnd();
                });
            });
        }
        
        if (this.disabledStateType == "expression") {
            code.addToTick("disabledState", () => {

                const new_val = code.evalBooleanProperty(
                    "bool",
                    "new_val",
                    this.disabledState as string,
                    "禁用状态表达式求值失败"
                );

                const cur_val = code.callObjectFunctionWithAssignment(
                    "bool",
                    "cur_val",
                    "lv_obj_has_state",
                    code.constant("LV_STATE_DISABLED")
                );

                code.ifNotEqual(new_val, cur_val, () => {
                    code.tickChangeStart();

                    code.if(new_val, () => {
                        code.callObjectFunction("lv_obj_add_state", code.constant("LV_STATE_DISABLED"));
                    }, () => {
                        code.callObjectFunction(code.isV9 ? "lv_obj_remove_state" : "lv_obj_clear_state", code.constant("LV_STATE_DISABLED"));
                    });

                    code.tickChangeEnd();
                });
            });
        }        
    }

    stylesToCode(code: LVGLCode) {
        const useStyle = this.styleTemplate;
        if (useStyle) {
            const lvglStyle = findLvglStyle(ProjectEditor.getProject(this), useStyle);
            if (lvglStyle) {
                if (code.lvglBuild) {
                    code.lvglBuild.assets.markLvglStyleUsed(lvglStyle);
                    code.lvglBuild.line(`${code.lvglBuild.getAddStyleFunctionName(lvglStyle)}(obj);`);
                } else {
                    lvglStyle.lvglAddStyleToObject(code.pageRuntime!, code.objectAccessor);
                }
            }
        }

        if (code.lvglBuild) {
            this.localStyles.lvglBuild(code.lvglBuild);
        } else {
            const runtime = code.pageRuntime!;
            this.localStyles.lvglCreate(runtime, this, code.objectAccessor);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    get childrenToRender() {
        // 不渲染不可见的 Tab
        return this.children.filter(child => {
            if (child instanceof ProjectEditor.LVGLTabWidgetClass) {
                if (child.tabview && child.tabIndex != child.tabview.selectedTabIndex) {
                    return false;
                }
            }
            return true;
        });
    }

    override render(flowContext: IFlowContext, width: number, height: number) {
        return this._lvglObj ? (
            <>
                <ComponentsContainerEnclosure
                    parent={this}
                    components={this.childrenToRender}
                    flowContext={flowContext}
                    width={width}
                    height={height}
                />
                {super.render(flowContext, width, height)}
            </>
        ) : null;
    }
}
