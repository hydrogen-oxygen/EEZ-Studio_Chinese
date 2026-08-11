import React from "react";
import { observable, makeObservable } from "mobx";

import { humanize } from "eez-studio-shared/string";
import { Rect } from "eez-studio-shared/geometry";
import { isArray, objectClone } from "eez-studio-shared/util";

import type { IDashboardComponentContext } from "eez-studio-types";

import type { IResizeHandler } from "project-editor/flow/flow-interfaces";
import type { ValueType } from "project-editor/features/variable/value-type";
import type { Project } from "project-editor/project/project";
import type {
    ProjectStore,
    IContextMenuContext,
    EezValueObject
} from "project-editor/store";

////////////////////////////////////////////////////////////////////////////////

export const enum PropertyType {
    Array,              // 数组
    Object,             // 对象
    Boolean,            // 布尔
    Number,             // 数字
    Enum,               // 枚举
    String,             // 字符串
    MultilineText,      // 多行文本
    Image,              // 图像
    Color,              // 颜色
    ThemedColor,        // 主题颜色
    RelativeFolder,     // 相对文件夹
    RelativeFile,       // 相对文件
    ObjectReference,    // 对象引用
    JSON,               // JSON
    JavaScript,         // JavaScript
    CSS,                // CSS
    Python,             // Python
    CPP,                // C++
    GUID,               // GUID
    NumberArrayAsString,// 数字数组（字符串形式）
    StringArray,        // 字符串数组
    ConfigurationReference, // 配置引用
    Any,                // 任意类型
    LVGLWidget,         // LVGL 部件
    Null                // 空
}

export const TYPE_NAMES: { [key in PropertyType]: string } = {
    [PropertyType.Array]: "数组",
    [PropertyType.Object]: "对象",
    [PropertyType.Boolean]: "布尔",
    [PropertyType.Number]: "数字",
    [PropertyType.Enum]: "枚举",
    [PropertyType.String]: "字符串",
    [PropertyType.MultilineText]: "多行文本",
    [PropertyType.Image]: "图像",
    [PropertyType.Color]: "颜色",
    [PropertyType.ThemedColor]: "主题颜色",
    [PropertyType.RelativeFolder]: "相对文件夹",
    [PropertyType.RelativeFile]: "相对文件",
    [PropertyType.ObjectReference]: "对象引用",
    [PropertyType.JSON]: "JSON",
    [PropertyType.JavaScript]: "JavaScript",
    [PropertyType.CSS]: "CSS",
    [PropertyType.Python]: "Python",
    [PropertyType.CPP]: "C++",
    [PropertyType.GUID]: "GUID",
    [PropertyType.NumberArrayAsString]: "数字数组（字符串形式）",
    [PropertyType.StringArray]: "字符串数组",
    [PropertyType.ConfigurationReference]: "配置引用",
    [PropertyType.Any]: "任意",
    [PropertyType.LVGLWidget]: "LVGL 部件",
    [PropertyType.Null]: "空"
};

export const enum ProjectType {
    UNDEFINED = "undefined",          // 未定义
    FIRMWARE = "firmware",            // 固件
    FIRMWARE_MODULE = "firmware-module", // 固件模块
    RESOURCE = "resource",            // 资源
    APPLET = "applet",                // 小程序
    DASHBOARD = "dashboard",          // 仪表盘
    LVGL = "lvgl",                    // LVGL
    IEXT = "iext",                    // IEXT
    EEZ_GUI_LITE = "eez-gui-lite"     // EEZ GUI Lite
}

////////////////////////////////////////////////////////////////////////////////

export interface EnumItem {
    id: string | number;
    label?: string;
    icon?: React.ReactNode;
}

export enum MessageType {
    INFO,       // 信息
    ERROR,      // 错误
    WARNING,    // 警告
    SEARCH_RESULT, // 搜索结果
    GROUP       // 分组
}

export interface IMessage {
    type: MessageType;
    text: string;
    object?: IEezObject;
    messages?: IMessage[];
}

export interface IPropertyGridGroupDefinition {
    id: string;
    title: string;
    position?: number | ((object: IEezObject) => number);
}

export interface PropertyProps {
    propertyInfo: PropertyInfo;
    objects: IEezObject[];
    readOnly: boolean;
    updateObject: (propertyValues: Object) => void;
    onClick?: (event: React.MouseEvent) => void;
}

export interface IOnSelectParams {
    textInputSelection?: {
        start: number | null;
        end: number | null;
        direction: "forward" | "backward" | "none" | null | undefined;
    };
}

export type FlowPropertyType =
    | "input"          // 输入
    | "assignable"     // 可赋值
    | "template-literal"  // 模板字面量
    | "scpi-template-literal"; // SCPI 模板字面量

export type LvglActionPropertyType =
    | "boolean"        // 布尔
    | "integer"        // 整数
    | "string"         // 字符串
    | `enum:${string}` // 枚举
    | "screen"         // 屏幕
    | "widget"         // 部件
    | `widget:${string}` // 部件（指定类型）
    | "group"          // 组
    | "style"          // 样式
    | "image"          // 图像
    | "style-property" // 样式属性
    | "style-value";   // 样式值

export interface PropertyInfo {
    name: string;
    type: PropertyType;

    // 动态类型
    dynamicType?: (object: IEezObject) => PropertyType;
    // 动态类型引用对象集合路径
    dynamicTypeReferencedObjectCollectionPath?: (
        object: IEezObject
    ) => string | undefined;

    // 可选属性
    displayName?: string | ((object: IEezObject) => string);          // 显示名称
    displayValue?: (object: IEezObject) => any;                      // 显示值
    enumItems?: EnumItem[] | ((object: IEezObject) => EnumItem[]);   // 枚举项
    enumDisallowUndefined?: boolean;                                 // 禁止未定义
    enumGroupSeparator?: string;                                     // 枚举分组分隔符
    typeClass?: EezClass;                                            // 类型类
    referencedObjectCollectionPath?: string;                         // 引用对象集合路径
    filterReferencedObjectCollection?: (                            // 过滤引用对象集合
        objects: IEezObject[],
        referencedObject: IEezObject
    ) => boolean;
    computed?: boolean;                                              // 计算属性
    computedIfNotLoadProject?: boolean;                              // 未加载项目时仍计算
    modifiable?: boolean;                                            // 可修改
    onSelect?: (                                                    // 选择时回调
        object: IEezObject,
        propertyInfo: PropertyInfo,
        params?: IOnSelectParams
    ) => Promise<any>;
    isOnSelectAvailable?: (object: IEezObject) => boolean;          // 选择是否可用
    onSelectTitle?: string;                                          // 选择对话框标题

    disabled?: (object: IEezObject, propertyInfo: PropertyInfo) => boolean; // 禁用

    hideInPropertyGrid?:                                             // 在属性网格中隐藏
        | boolean
        | ((object: IEezObject, propertyInfo: PropertyInfo) => boolean);
    readOnlyInPropertyGrid?:                                         // 在属性网格中只读
        | boolean
        | ((object: IEezObject, propertyInfo: PropertyInfo) => boolean);

    propertyGridGroup?: IPropertyGridGroupDefinition;               // 属性网格分组
    propertyGridRowComponent?: React.ComponentType<PropertyProps>;   // 行组件
    propertyGridColumnComponent?: React.ComponentType<PropertyProps>;// 列组件
    propertyGridFullRowComponent?: React.ComponentType<PropertyProps>;// 整行组件
    propertyGridCollapsable?: boolean;                               // 可折叠
    propertyGridCollapsableDefaultPropertyName?: string;            // 折叠默认属性名
    propertyGridCollapsableEnabled?: (object: IEezObject) => boolean; // 是否启用折叠
    enumerable?:                                                    // 可枚举
        | boolean
        | ((object: IEezObject, propertyInfo: PropertyInfo) => boolean);
    showOnlyChildrenInTree?: boolean;                               // 树中仅显示子项
    isOptional?:                                                   // 是否可选
        | boolean
        | ((object: IEezObject, propertyInfo: PropertyInfo) => boolean);
    defaultValue?: any;                                             // 默认值
    inheritable?: boolean;                                          // 可继承
    nonInheritable?: boolean;                                       // 不可继承
    propertyMenu?: (props: PropertyProps) => Electron.MenuItem[];   // 属性菜单
    unique?:                                                       // 唯一性校验
        | boolean
        | ((
              object: IEezObject,
              parent: IEezObject,
              propertyInfo: PropertyInfo
          ) => (
              object: any,
              ruleName: string
          ) => Promise<string | null> | string | null);
    uniqueIdentifier?:                                             // 唯一标识
        | boolean
        | ((
              object: IEezObject,
              parent: IEezObject,
              propertyInfo: PropertyInfo
          ) => (
              object: any,
              ruleName: string
          ) => Promise<string | null> | string | null);
    skipSearch?: boolean;                                           // 跳过搜索
    childLabel?: (childObject: IEezObject, childLabel: string) => string; // 子标签
    check?: (object: IEezObject, messages: IMessage[]) => void;     // 检查
    interceptAddObject?: (                                         // 拦截添加对象
        parentObject: IEezObject,
        object: EezObject
    ) => EezObject;
    downloadFileName?: (                                           // 下载文件名
        object: IEezObject,
        propertyInfo: PropertyInfo
    ) => string;
    partOfNavigation?: boolean;                                     // 导航的一部分
    fileFilters?: any;                                              // 文件过滤器

    flowProperty?:                                                 // 流程属性类型
        | FlowPropertyType
        | ((object: IEezObject | undefined) => FlowPropertyType | undefined);
    expressionType?: ValueType;                                    // 表达式类型
    expressionIsConstant?: boolean;                                // 表达式是否常量
    isOutputOptional?:                                             // 输出是否可选
        | boolean
        | ((object: IEezObject, propertyInfo: PropertyInfo) => boolean);

    isFlowPropertyBuildable?: (                                    // 流程属性是否可构建
        object: IEezObject,
        propertyInfo: PropertyInfo
    ) => boolean;

    monospaceFont?: boolean;                                        // 等宽字体
    cssAttributeName?: string;                                      // CSS 属性名
    checkboxStyleSwitch?: boolean;                                  // 复选框样式（开关）
    checkboxHideLabel?: boolean;                                    // 隐藏复选框标签
    disableBitmapPreview?: boolean;                                // 禁用位图预览
    inputPlaceholder?: (object: IEezObject) => string;             // 输入占位符
    embeddedImage?: boolean | ((object: IEezObject) => boolean);   // 嵌入图片

    visitProperty?: (parentObject: IEezObject) => EezValueObject[]; // 访问属性

    formText?:                                                     // 表单文本
        | string
        | ((object: IEezObject | undefined) => React.ReactNode | undefined);

    hasExpressionProperties?: boolean;                              // 是否包含表达式属性

    hideInDocumentation?: "widget" | "action" | "all" | "none";    // 在文档中隐藏

    getInstrumentId?: (parentObject: IEezObject) => string | undefined; // 获取仪器ID

    arrayPropertyEditorAdditionalButtons?: (                       // 数组属性编辑器额外按钮
        parentObject: IEezObject,
        propertyInfo: PropertyInfo,
        projectStore: ProjectStore
    ) => React.ReactNode[];

    colorEditorForLiteral?: boolean;                               // 颜色编辑器（字面量）

    lvglActionPropertyType?: LvglActionPropertyType;              // LVGL 动作属性类型

    showArrayCollapsedByDefaultInPropertyGrid?: boolean;           // 属性网格中数组默认折叠
    hideElementIndexInPropertyGrid?: boolean;                      // 隐藏元素索引

    noColSpanForArray?: boolean;                                   // 数组不跨列
}

export type InheritedValue =
    | {
          value: any;
          source: IEezObject | undefined;
      }
    | undefined;

export interface SerializedData {
    originProjectFilePath: string;        // 原始项目文件路径

    objectClassName: string;              // 对象类名
    classInfo?: ClassInfo;                // 类信息

    object?: EezObject;                   // 单个对象
    objectParentPath?: string;            // 对象父路径

    objects?: EezObject[];                // 对象数组
    objectsParentPath?: string[];         // 对象父路径数组
}

export type LVGLParts = string;

interface LVGLClassInfoProperties {
    parts: LVGLParts[] | ((object: IEezObject) => LVGLParts[]); // 部件列表
    defaultFlags: string;                  // 默认标志

    oldInitFlags?: string;                 // 旧初始化标志
    oldDefaultFlags?: string;              // 旧默认标志
}

export type WidgetEvents = {
    [eventName: string]: {
        code: number;
        paramExpressionType: ValueType;
        oldName?: string;
    };
};

export interface ClassInfo {
    properties: PropertyInfo[];            // 属性列表

    _arrayAndObjectProperties?: PropertyInfo[]; // 数组和对象属性（内部使用）

    // 可选属性
    getClass?: (                            // 获取类
        projectStore: ProjectStore,
        jsObject: any,
        aClass: EezClass
    ) => any;
    label?: (object: IEezObject) => string; // 标签
    listLabel?: (object: IEezObject, collapsed: boolean) => React.ReactNode; // 列表标签
    propertiesPanelLabel?: (object: IEezObject) => React.ReactNode; // 属性面板标签

    parentClassInfo?: ClassInfo;            // 父类信息

    componentPaletteGroupName?: string;     // 组件面板分组名
    componentPaletteLabel?: string;         // 组件面板标签
    enabledInComponentPalette?: (          // 在组件面板中启用
        projectType: ProjectType,
        projectStore?: ProjectStore
    ) => boolean;

    hideInProperties?: boolean;             // 在属性中隐藏
    isPropertyMenuSupported?: boolean;      // 是否支持属性菜单

    newItem?: (parent: IEezObject) => Promise<EezObject | undefined>; // 新建项

    getInheritedValue?: (                  // 获取继承值
        object: IEezObject,
        propertyName: string
    ) => InheritedValue;
    defaultValue?: any;                    // 默认值
    componentDefaultValue?: (projectStore: ProjectStore) => any; // 组件默认值
    findPastePlaceInside?: (               // 查找粘贴位置
        object: IEezObject,
        classInfo: ClassInfo,
        isSingleObject: boolean
    ) => IEezObject | PropertyInfo | undefined;

    icon?: React.ReactNode;                // 图标
    getIcon?: (                            // 获取图标
        object?: IEezObject,
        componentClass?: IObjectClassInfo,
        projectStore?: ProjectStore
    ) => React.ReactNode | undefined;

    componentHeaderColor?:                 // 组件头部颜色
        | ((object?: IEezObject, componentClass?: IObjectClassInfo, projectStore?: ProjectStore) => string)
        | string;
    componentHeaderTextColor?: string;     // 组件头部文字颜色

    beforeLoadHook?: (                     // 加载前钩子
        object: IEezObject,
        jsObject: any,
        project: Project
    ) => void;

    afterLoadHook?: (object: IEezObject, project: Project) => void; // 加载后钩子

    updateObjectValueHook?: (object: IEezObject, values: any) => void; // 更新对象值钩子

    extendContextMenu?: (                  // 扩展上下文菜单
        object: IEezObject,
        context: IContextMenuContext,
        objects: IEezObject[],
        menuItems: Electron.MenuItem[],
        editable: boolean
    ) => void;

    check?: (object: IEezObject, messages: IMessage[]) => void; // 检查

    getRect?: (object: IEezObject) => Rect; // 获取矩形
    setRect?: (object: IEezObject, rect: Partial<Rect>) => void; // 设置矩形
    isMoveable?: (object: IEezObject) => boolean; // 是否可移动
    isSelectable?: (object: IEezObject) => boolean; // 是否可选择
    showSelectedObjectsParent?: (object: IEezObject) => boolean; // 显示选中对象的父级
    getResizeHandlers?: (                 // 获取调整大小手柄
        object: IEezObject
    ) => IResizeHandler[] | undefined | false;
    open?: (object: IEezObject) => void;   // 打开

    flowComponentId?: number;              // 流程组件ID

    isFlowExecutableComponent?: boolean;   // 是否为可执行流程组件

    getImportedProject?: (object: IEezObject) => // 获取导入的项目
        | {
              findReferencedObject: (
                  root: IEezObject,
                  referencedObjectCollectionPath: string,
                  referencedObjectName: string
              ) => IEezObject | undefined;
          }
        | undefined;

    deleteObjectRefHook?: (                // 删除对象引用钩子
        object: IEezObject,
        options?: { dropPlace?: IEezObject | PropertyInfo }
    ) => void;
    deleteObjectFilterHook?: (object: IEezObject) => boolean; // 删除对象过滤钩子

    objectsToClipboardData?: (objects: IEezObject) => any; // 对象转剪贴板数据

    pasteItemHook?: (                     // 粘贴项钩子
        object: IEezObject,
        clipboardData: {
            serializedData: SerializedData;
            pastePlace: EezObject;
        }
    ) => IEezObject;

    onAfterPaste?: (newObject: IEezObject, fromObject: IEezObject) => void; // 粘贴后

    lvgl?:                                 // LVGL 相关配置
        | LVGLClassInfoProperties
        | ((object: IEezObject, project: Project) => LVGLClassInfoProperties);

    showTreeCollapseIcon?: "always" | "has-children" | "never"; // 树折叠图标显示策略

    getAdditionalFlowProperties?: (object: IEezObject) => PropertyInfo[]; // 获取额外流程属性

    execute?: (context: IDashboardComponentContext) => void; // 执行

    findChildIndex?: (parent: IEezObject[], child: IEezObject) => number; // 查找子索引

    widgetEvents?: WidgetEvents | ((object: IEezObject) => WidgetEvents); // 部件事件

    addObjectHook?: (object: IEezObject, parent: IEezObject) => void; // 添加对象钩子

    overrideEventParamExpressionType?: (  // 覆盖事件参数表达式类型
        object: IEezObject,
        eventName: string
    ) => ValueType | undefined;

    getPropertyDisplayName?: (            // 获取属性显示名称
        object: IEezObject,
        propertyKey: string
    ) => string | undefined;
}

/**
 * 基于基类信息生成派生类信息
 * @param baseClassInfo 基类信息
 * @param derivedClassInfoProperties 派生类属性覆盖
 * @returns 合并后的类信息
 */
export function makeDerivedClassInfo(
    baseClassInfo: ClassInfo,
    derivedClassInfoProperties: Partial<ClassInfo>
): ClassInfo {
    if (derivedClassInfoProperties.properties) {
        const b = baseClassInfo.properties; // 基类属性
        const d = derivedClassInfoProperties.properties; // 派生类属性
        const r = []; // 结果属性数组

        // 将基类属性和被覆盖的属性加入结果
        for (let i = 0; i < b.length; ++i) {
            let j;
            for (j = 0; j < d.length; ++j) {
                if (b[i].name === d[j].name) {
                    break;
                }
            }
            r.push(j < d.length ? d[j] /* 被覆盖 */ : b[i] /* 保留基类 */);
        }

        // 将派生类新增（未被覆盖）的属性加入结果
        for (let i = 0; i < d.length; ++i) {
            let j;
            for (j = 0; j < r.length; ++j) {
                if (d[i].name === r[j].name) {
                    break;
                }
            }
            if (j === r.length) {
                r.push(d[i]);
            }
        }

        derivedClassInfoProperties.properties = r;
    }

    if (derivedClassInfoProperties.defaultValue && baseClassInfo.defaultValue) {
        derivedClassInfoProperties.defaultValue = Object.assign(
            {},
            baseClassInfo.defaultValue,
            derivedClassInfoProperties.defaultValue
        );
    }

    const baseBeforeLoadHook = baseClassInfo.beforeLoadHook;
    const derivedBeforeLoadHook = derivedClassInfoProperties.beforeLoadHook;
    if (baseBeforeLoadHook && derivedBeforeLoadHook) {
        derivedClassInfoProperties.beforeLoadHook = (
            object: IEezObject,
            jsObject: any,
            project: Project
        ) => {
            baseBeforeLoadHook(object, jsObject, project);
            derivedBeforeLoadHook(object, jsObject, project);
        };
    }

    const baseCheck = baseClassInfo.check;
    const derivedCheck = derivedClassInfoProperties.check;
    if (baseCheck && derivedCheck) {
        derivedClassInfoProperties.check = (
            object: IEezObject,
            messages: IMessage[]
        ) => {
            baseCheck(object, messages);
            derivedCheck(object, messages);
        };
    }

    const baseUpdateObjectValueHook = baseClassInfo.updateObjectValueHook;
    const derivedUpdateObjectValueHook =
        derivedClassInfoProperties.updateObjectValueHook;
    if (baseUpdateObjectValueHook && derivedUpdateObjectValueHook) {
        derivedClassInfoProperties.updateObjectValueHook = (
            object: IEezObject,
            values: any
        ) => {
            baseUpdateObjectValueHook(object, values);
            derivedUpdateObjectValueHook(object, values);
        };
    }

    const baseAdditionalFlowProperties =
        baseClassInfo.getAdditionalFlowProperties;
    const derivedAdditionalFlowProperties =
        derivedClassInfoProperties.getAdditionalFlowProperties;
    if (baseAdditionalFlowProperties && derivedAdditionalFlowProperties) {
        derivedClassInfoProperties.getAdditionalFlowProperties = (
            object: IEezObject
        ) => {
            return [
                ...baseAdditionalFlowProperties(object),
                ...derivedAdditionalFlowProperties(object)
            ];
        };
    }

    const derivedClassInfo = Object.assign(
        {},
        baseClassInfo,
        derivedClassInfoProperties
    );
    derivedClassInfo.parentClassInfo = baseClassInfo;
    return derivedClassInfo;
}

////////////////////////////////////////////////////////////////////////////////

export type IEezObject = EezObject | EezObject[];

////////////////////////////////////////////////////////////////////////////////

export class EezObject {
    static classInfo: ClassInfo;

    objID: string;

    makeEditable() {
        makeObservable(this, {
            objID: observable
        });
    }
}

export type EezClass = typeof EezObject;

let classNameToEezClassMap = new Map<string, EezClass>();
export let eezClassToClassNameMap = new Map<EezClass, string>();

/**
 * 注册类名与类构造函数的映射
 */
export function registerClass(name: string, eezClass: EezClass) {
    classNameToEezClassMap.set(name, eezClass);
    eezClassToClassNameMap.set(eezClass, name);
}

/**
 * 根据类名获取类构造函数
 */
export function getClassByName(projectStore: ProjectStore, className: string) {
    const result = classNameToEezClassMap.get(className);
    if (result) {
        return result;
    }

    return projectStore.getClassByName(className);
}

/**
 * 获取所有已注册的类
 */
export function getAllClasses() {
    return [...classNameToEezClassMap.values()];
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 判断一个对象是否为 IEezObject 类型
 */
export function isEezObject(object: any): object is IEezObject {
    return (
        object instanceof EezObject ||
        (isArray(object) && (object.length == 0 || isEezObject(object[0])))
    );
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 获取对象的类
 */
export function getClass(object: IEezObject) {
    if (isArray(object)) {
        return getPropertyInfo(object).typeClass!;
    } else {
        return object.constructor as EezClass;
    }
}

/**
 * 获取对象的类信息
 */
export function getClassInfo(object: IEezObject): ClassInfo {
    return getClass(object).classInfo;
}

/**
 * 根据类名查找类
 */
export function findClass(className: string) {
    return classNameToEezClassMap.get(className);
}

export interface IObjectClassInfo {
    id: string;
    name: string;
    objectClass: EezClass;
    displayName?: string;
    componentPaletteGroupName?: string;
    props?: any;
}

/**
 * 获取从指定父类派生的所有子类
 */
export function getClassesDerivedFrom(
    projectStore: ProjectStore | undefined,
    parentClass: EezClass
) {
    const derivedClasses: IObjectClassInfo[] = [];

    for (const className of classNameToEezClassMap.keys()) {
        const objectClass = classNameToEezClassMap.get(className)!;
        if (isProperSubclassOf(objectClass.classInfo, parentClass.classInfo)) {
            derivedClasses.push({
                id: className,
                name: className,
                objectClass
            });
        }
    }

    if (projectStore) {
        for (const [
            className,
            objectClass
        ] of projectStore.importedActionComponentClasses) {
            if (
                isProperSubclassOf(objectClass.classInfo, parentClass.classInfo)
            ) {
                derivedClasses.push({
                    id: className,
                    name: className,
                    objectClass
                });
            }
        }
    }

    return derivedClasses;
}

/**
 * 检查 classInfo 是否为 baseClassInfo 的子类（包括自身）
 */
export function isSubclassOf(
    classInfo: ClassInfo | undefined,
    baseClassInfo: ClassInfo
) {
    while (classInfo) {
        if (classInfo === baseClassInfo) {
            return true;
        }
        classInfo = classInfo.parentClassInfo;
    }
    return false;
}

/**
 * 检查 classInfo 是否为 baseClassInfo 的真子类（不包括自身）
 */
export function isProperSubclassOf(
    classInfo: ClassInfo | undefined,
    baseClassInfo: ClassInfo
) {
    if (classInfo) {
        while (true) {
            classInfo = classInfo.parentClassInfo;
            if (!classInfo) {
                return false;
            }
            if (classInfo === baseClassInfo) {
                return true;
            }
        }
    }
    return false;
}

/**
 * 获取对象的 ID
 */
export function getId(object: IEezObject) {
    return (object as any)._eez_id;
}

/**
 * 设置对象的 ID
 */
export function setId(
    projectStore: ProjectStore,
    object: IEezObject,
    id: string
) {
    (object as any)._eez_id = id;
    projectStore.objects.set(id, object);
}

/**
 * 获取对象的父级（非响应式）
 */
export function getParentNotObservable(
    object: IEezObject
): IEezObject | undefined {
    return (object as any)._eez_parent;
}

/**
 * 获取对象的父级（响应式）
 */
export function getParent(object: IEezObject): IEezObject {
    const parent = (object as any)._eez_parent;

    // 使 _eez_parent 可观察
    if (parent) {
        if (isArray(parent)) {
            parent.indexOf(object);
        } else {
            parent[(object as any)._eez_key];
        }
    }

    return parent;
}

/**
 * 设置对象的父级
 */
export function setParent(object: IEezObject, parentObject: IEezObject) {
    (object as any)._eez_parent = parentObject;
}

/**
 * 获取对象在其父级中的键名
 */
export function getKey(object: IEezObject): string {
    return (object as any)._eez_key;
}

/**
 * 设置对象在其父级中的键名
 */
export function setKey(object: IEezObject, key: string) {
    (object as any)._eez_key = key;
}

/**
 * 获取对象的属性信息
 */
export function getPropertyInfo(object: IEezObject): PropertyInfo {
    return (object as any)._eez_propertyInfo;
}

/**
 * 设置对象的属性信息
 */
export function setPropertyInfo(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    (object as any)._eez_propertyInfo = propertyInfo;
}

/**
 * 检查 object 是否为 ancestor 的后代（包括自身）
 */
export function isAncestor(object: IEezObject, ancestor: IEezObject): boolean {
    if (object == undefined || ancestor == undefined) {
        return false;
    }

    if (object == ancestor) {
        return true;
    }

    let parent = getParent(object);
    return !!parent && isAncestor(parent, ancestor);
}

/**
 * 检查 object 是否为 ancestor 的真后代（不包括自身）
 */
export function isProperAncestor(object: IEezObject, ancestor: IEezObject) {
    if (object == undefined || object == ancestor) {
        return false;
    }

    let parent = getParent(object);
    return !!parent && isAncestor(parent, ancestor);
}

/**
 * 在类信息中根据属性名查找属性定义（支持路径，如 "arr[0].prop"）
 */
export function findPropertyByNameInClassInfo(
    classInfo: ClassInfo,
    propertyName: string
): PropertyInfo | undefined {
    let i = propertyName.indexOf("[");
    if (i != -1) {
        // 形如 arr[index].{name}
        const propertyInfo = findPropertyByNameInClassInfo(
            classInfo,
            propertyName.substring(0, i)
        );
        if (!propertyInfo) {
            return undefined;
        }

        if (propertyInfo.type != PropertyType.Array) {
            return undefined;
        }

        let j = propertyName.indexOf("]", i + 1);
        return findPropertyByNameInClassInfo(
            propertyInfo.typeClass!.classInfo,
            propertyName.substring(j + 2)
        );
    }

    i = propertyName.indexOf(".");
    if (i != -1) {
        // 形如 object.{name}
        const propertyInfo = findPropertyByNameInClassInfo(
            classInfo,
            propertyName.substring(0, i)
        );
        if (!propertyInfo || !propertyInfo.typeClass) {
            return undefined;
        }

        return findPropertyByNameInClassInfo(
            propertyInfo.typeClass.classInfo,
            propertyName.substring(i + 1)
        );
    }

    return classInfo.properties.find(
        propertyInfo => propertyInfo.name == propertyName
    );
}

/**
 * 判断属性是否禁用
 */
export function isPropertyDisabled(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    if (propertyInfo.disabled && propertyInfo.disabled(object, propertyInfo)) {
        return true;
    }

    return false;
}

/**
 * 判断属性是否隐藏
 */
export function isPropertyHidden(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    if (propertyInfo.disabled && propertyInfo.disabled(object, propertyInfo)) {
        return true;
    }

    if (propertyInfo.hideInPropertyGrid != undefined) {
        if (typeof propertyInfo.hideInPropertyGrid == "boolean") {
            return propertyInfo.hideInPropertyGrid;
        }
        return propertyInfo.hideInPropertyGrid(object, propertyInfo);
    }

    return false;
}

/**
 * 判断属性是否只读
 */
export function isPropertyReadOnly(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    if (propertyInfo.readOnlyInPropertyGrid === undefined) {
        return false;
    }

    if (typeof propertyInfo.readOnlyInPropertyGrid === "boolean") {
        return propertyInfo.readOnlyInPropertyGrid;
    }

    return propertyInfo.readOnlyInPropertyGrid(object, propertyInfo);
}

/**
 * 判断一组对象中是否存在只读属性
 */
export function isAnyPropertyReadOnly(
    objects: IEezObject[],
    propertyInfo: PropertyInfo
) {
    return !!objects.find(object => isPropertyReadOnly(object, propertyInfo));
}

/**
 * 判断属性是否可枚举
 */
export function isPropertyEnumerable(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    if (propertyInfo.enumerable === undefined) {
        return true;
    }

    if (typeof propertyInfo.enumerable === "boolean") {
        return propertyInfo.enumerable;
    }

    return propertyInfo.enumerable(object, propertyInfo);
}

/**
 * 判断属性是否可选
 */
export function isPropertyOptional(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    if (!propertyInfo.isOptional) {
        return false;
    }

    if (typeof propertyInfo.isOptional == "boolean") {
        return propertyInfo.isOptional;
    }

    return propertyInfo.isOptional(object, propertyInfo);
}

/**
 * 深度获取对象的属性值（支持路径，如 "arr[0].prop"）
 */
export function getProperty(object: IEezObject, name: string): any {
    // 深度获取，名称可以是：
    //    - 标识符
    //    - array[index].{name}
    //    - object.{name}

    let i1 = name.indexOf("[");
    let i2 = name.indexOf(".");

    if (i1 != -1 && i1 < i2) {
        const i = i1;
        // arr[index].{name}
        let j = name.indexOf("]", i + 1);
        return getProperty(
            (object as any)[name.substring(0, i)][
                Number.parseInt(name.substring(i + 1))
            ],
            name.substring(j + 2)
        );
    }

    if (i2 != -1) {
        const i = i2;
        // object.{name}
        return getProperty(
            (object as any)[name.substring(0, i)],
            name.substring(i + 1)
        );
    }

    return (object as any)[name];
}

/**
 * 获取属性的显示名称
 */
export function getObjectPropertyDisplayName(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    if (propertyInfo.displayName) {
        if (typeof propertyInfo.displayName === "string") {
            return propertyInfo.displayName;
        }
        return propertyInfo.displayName(object);
    }
    return humanize(propertyInfo.name);
}

/**
 * 获取根对象（顶层对象）
 */
export function getRootObject(object: IEezObject) {
    for (
        let parent = getParentNotObservable(object);
        parent;
        parent = getParentNotObservable(object)
    ) {
        object = parent;
    }
    return object;
}

/**
 * 获取对象的所有祖先（从根到自身，包括自身）
 */
export function getAncestors(object: IEezObject): IEezObject[] {
    let result = [object];
    for (let parent = getParent(object); parent; parent = getParent(parent)) {
        result.unshift(parent);
    }
    return result;
}

/**
 * 检查所有对象是否具有相同的父级
 */
export function areAllChildrenOfTheSameParent(objects: IEezObject[]) {
    for (let i = 1; i < objects.length; i++) {
        if (getParent(objects[i]) !== getParent(objects[0])) {
            return false;
        }
    }
    return true;
}

/**
 * 获取类的 LVGL 属性配置
 */
export function getClassInfoLvglProperties(object: IEezObject) {
    const classInfo = getClassInfo(object);
    if (classInfo.lvgl) {
        if (typeof classInfo.lvgl == "object") {
            return classInfo.lvgl;
        }
        return classInfo.lvgl(object, getRootObject(object) as Project);
    } else {
        return {
            parts: [],
            defaultFlags: "",
            oldInitFlags: "",
            oldDefaultFlags: ""
        };
    }
}

/**
 * 获取 LVGL 部件的 parts 列表
 */
export function getClassInfoLvglParts(object: IEezObject) {
    const lvglClassInfoProperties = getClassInfoLvglProperties(object);

    if (typeof lvglClassInfoProperties.parts == "function") {
        return lvglClassInfoProperties.parts(object);
    }

    return lvglClassInfoProperties.parts;
}

/**
 * 获取类的默认值（针对 LVGL 做特殊处理）
 */
export function getDefaultValue(
    projectStore: ProjectStore | undefined,
    classInfo: ClassInfo
) {
    function removeClickable(flags: string) {
        const flagsArr = flags.split("|");
        const i = flagsArr.indexOf("CLICKABLE");
        if (i != -1) {
            flagsArr.splice(i, 1);
        }
        return flagsArr.join("|");
    }

    let defaultValue = classInfo.defaultValue;
    if (defaultValue) {
        if (classInfo.lvgl) {
            if (typeof classInfo.lvgl == "function") {
                if (projectStore) {
                    defaultValue = objectClone(defaultValue);
                    defaultValue.widgetFlags = removeClickable(
                        classInfo.lvgl(
                            projectStore.project,
                            projectStore.project
                        ).defaultFlags
                    );
                }
            } else {
                defaultValue = objectClone(defaultValue);
                defaultValue.widgetFlags = removeClickable(
                    classInfo.lvgl.defaultFlags
                );
            }
        }
    }
    return defaultValue;
}

/**
 * 判断流程属性是否可构建
 */
export function isFlowPropertyBuildable(
    object: IEezObject,
    propertyInfo: PropertyInfo
) {
    if (propertyInfo.isFlowPropertyBuildable) {
        return propertyInfo.isFlowPropertyBuildable(object, propertyInfo);
    }

    return true;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 矩形对象类（用于表示边距等）
 */
export class RectObject extends EezObject {
    static classInfo: ClassInfo = {
        properties: [
            {
                name: "top",
                type: PropertyType.Number
            },
            {
                name: "right",
                type: PropertyType.Number
            },
            {
                name: "bottom",
                type: PropertyType.Number
            },
            {
                name: "left",
                type: PropertyType.Number
            }
        ],
        defaultValue: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    };

    top: number;
    right: number;
    bottom: number;
    left: number;

    override makeEditable() {
        super.makeEditable();

        makeObservable(this, {
            top: observable,
            right: observable,
            bottom: observable,
            left: observable
        });
    }
}

registerClass("RectObject", RectObject);
