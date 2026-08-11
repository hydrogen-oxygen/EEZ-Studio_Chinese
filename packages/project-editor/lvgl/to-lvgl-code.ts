import type { IEezObject } from "project-editor/core/object";
import { ProjectEditor } from "project-editor/project-editor-interface";
import { findBitmap, Project } from "project-editor/project/project";
import type { ICustomWidgetCreateParams } from "project-editor/features/page/page";

import type { LVGLWidget } from "project-editor/lvgl/widgets";
import type { LVGLPageRuntime } from "project-editor/lvgl/page-runtime";
import type { LVGLBuild } from "project-editor/lvgl/build";
import {
    escapeCString,
    getExpressionPropertyData,
    getExpressionPropertyInitalValue,
    unescapeCString
} from "project-editor/lvgl/widget-common";

////////////////////////////////////////////////////////////////////////////////

export interface LVGLCode {
    // 获取项目对象
    get project(): Project;

    // 获取页面运行时或构建上下文
    get pageRuntime(): LVGLPageRuntime | undefined;
    get lvglBuild(): LVGLBuild | undefined;

    // 是否为 LVGL v9 版本
    get isV9(): boolean;
    // 检查 LVGL 版本是否匹配给定前缀列表
    isLVGLVersion(prefixes: string[]): boolean;
    // 是否支持 Flow（数据流）
    get hasFlowSupport(): boolean;
    // 是否支持屏幕生命周期
    get screensLifetimeSupport(): boolean;

    // 获取 Flow 状态
    get flowState(): any;

    // 获取 LVGL 事件目标对象的函数名
    get lv_event_get_target(): string;

    // 结束当前控件的生成
    endWidget(): void;

    // 常量处理
    constant(constant: string): any;
    // 字符串字面量处理
    stringLiteral(str: string): any;
    // 字符串属性处理（支持表达式/字面量）
    stringProperty(
        type: string,
        value: string,
        previewValue?: string,
        nonEmpty?: boolean
    ): any;
    // 颜色处理
    color(color: string | number): any;
    // 图像资源处理
    image(image: string): any;

    // 位或运算
    or(...args: any): any;

    // 获取当前对象访问器
    get objectAccessor(): any;

    // 创建屏幕
    createScreen(): any;
    // 创建对象（带位置和尺寸）
    createObject(createObjectFunction: string, ...args: any[]): any;
    // 创建对象（不带位置和尺寸）
    createObjectWithoutPosAndSize(createObjectFunction: string, ...args: any[]): any;
    // 获取对象（通过函数）
    getObject(getObjectFunction: string, ...args: any[]): any;
    // 获取父对象
    getParentObject(getObjectFunction: string, ...args: any[]): any;

    // 调用对象成员函数
    callObjectFunction(func: string, ...args: any[]): any;
    // 调用对象成员函数并赋值给变量
    callObjectFunctionWithAssignment(
        declType: string,
        declName: string,
        func: string,
        ...args: any[]
    ): any;
    // 调用对象成员函数并赋值给状态变量
    callObjectFunctionWithAssignmentToStateVar(
        id: string,
        declType: string,
        declNamePrefix: string,
        func: string,
        ...args: any[]
    ): any;
    // 内联调用对象成员函数（返回表达式）
    callObjectFunctionInline(func: string, ...args: any[]): any;

    // 调用全局函数
    callFreeFunction(func: string, ...args: any[]): any;
    // 调用全局函数并赋值给变量
    callFreeFunctionWithAssignment(
        declType: string,
        declName: string,
        func: string,
        ...args: any[]
    ): any;
    // 内联调用全局函数（返回表达式）
    callFreeFunctionInline(func: string, ...args: any[]): any;

    // 计算文本属性（表达式求值）
    evalTextProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ): any;
    // 计算整数属性
    evalIntegerProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ): any;
    // 计算布尔属性
    evalBooleanProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ): any;
    // 计算无符号整数属性
    evalUnsignedIntegerProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ): any;
    // 计算字符串数组属性并拼接
    evalStringArrayPropertyAndJoin(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ): any;

    // 赋值整数属性
    assignIntegerProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ): void;
    // 赋值布尔属性
    assignBooleanProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ): void;
    // 赋值字符串属性
    assignStringProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ): void;

    // 添加 tick 回调（单属性）
    addToTick(propertyName: string, callback: () => void): void;
    // 添加 tick 回调（多属性）
    addToTickMulti(
        properties: {
            propertyName: string;
            callback: () => any;
        }[], 
        finalCallback: (...args: any) => void
    ) : void;
    // 开始 tick 变化
    tickChangeStart(): void;
    // 结束 tick 变化
    tickChangeEnd(): void;

    // 变量赋值语句
    assign(declType: string, declName: string, rhs: any): any;

    // 条件判断 if
    if(a: any, callback: () => void, elseCallback?: () => void): void;
    // 取反条件判断 if not
    ifNot(a: any, callback: () => void): void;
    // 字符串不相等判断
    ifStringNotEqual(a: any, b: any, callback: () => void): void;
    // 字符串前 n 个字符不相等判断
    ifStringNotEqualN(a: any, b: any, n: any, callback: () => void): void;

    // 小于判断
    ifLess(a: any, b: any, callback: () => void): void;
    // 不等于判断
    ifNotEqual(a: any, b: any, callback: () => void): void;

    // 构建颜色（单色）
    buildColor<T>(
        object: IEezObject,
        color: string,
        getParams: () => T,
        callback: (color: string, params: T) => void,
        updateCallback: (color: any, params: T) => void
    ): void;
    // 构建颜色（双色）
    buildColor2<T>(
        object: IEezObject,
        color1: string,
        color2: string,
        getParams: () => T,
        callback: (color1: string, color2: string, params: T) => void,
        updateCallback: (color1: any, color2: any, params: T) => void
    ): void;
    // 生成状态变量
    genStateVar(id: string, type: string, prefixName: string): string;
    // 赋值给状态变量
    assingToStateVar(varName: string, value: string): void;

    // 代码块开始
    blockStart(param: any): void;
    // 代码块结束
    blockEnd(param: any): void;

    // 添加事件处理器
    addEventHandler(
        eventName: string,
        callback: (event: any, tick_value_change_obj: any) => void
    ): void;

    // 控件生成后执行回调
    postWidgetExecute(callback: () => void): void;

    // 页面生成后执行回调
    postPageExecute(callback: () => void): void;
}

////////////////////////////////////////////////////////////////////////////////

// 模拟器中的 LVGL 代码生成实现
export class SimulatorLVGLCode implements LVGLCode {
    constructor(
        public runtime: LVGLPageRuntime,
        public constants: { [constant: string]: number }
    ) {}

    widget: LVGLWidget;
    parentObj: number;
    customWidget?: ICustomWidgetCreateParams;

    obj: number; // 当前 LVGL 对象指针

    flowState: number;
    componentIndex: number;
    propertyIndex: number;

    buildColorParams: any;

    allocated: number[] = []; // 记录已分配的内存指针，用于释放

    postWidgetExecuteCallbacks: (() => void)[] = [];

    // 开始生成控件
    startWidget(
        widget: LVGLWidget,
        parentObj: number,
        customWidget?: ICustomWidgetCreateParams
    ) {
        this.widget = widget;
        this.parentObj = parentObj;
        this.customWidget = customWidget;
        this.buildColorParams = undefined;
    }

    // 结束控件生成，执行回调并释放临时内存
    endWidget() {
        for (const callback of this.postWidgetExecuteCallbacks) {
            callback();
        }
        this.postWidgetExecuteCallbacks = [];

        this.callObjectFunction("lv_obj_update_layout");

        for (const tempStr of this.allocated) {
            this.runtime.wasm._free(tempStr);
        }
        this.allocated = [];
    }

    get project() {
        return this.runtime.project;
    }

    get pageRuntime() {
        return this.runtime;
    }

    get lvglBuild() {
        return undefined;
    }

    get isV9(): boolean {
        return this.runtime.isV9;
    }

    isLVGLVersion(prefixes: string[]): boolean {
        return this.runtime.isLVGLVersion(prefixes);
    }

    get hasFlowSupport() {
        return this.runtime.project.projectTypeTraits.hasFlowSupport;
    }

    get screensLifetimeSupport() {
        return this.runtime.project.settings.build.screensLifetimeSupport;
    }

    get lv_event_get_target() {
        return this.isV9 ? "lv_event_get_target_obj" : "lv_event_get_target";
    }

    constant(constant: string) {
        return this.constants[constant];
    }

    stringLiteral(str: string) {
        return this.runtime.stringLiteral(str);
    }

    stringProperty(
        type: string,
        value: string,
        previewValue?: string,
        nonEmpty?: boolean
    ) {
        let str;
        if (type == "expression" && this.runtime.wasm.assetsMap) {
            str = nonEmpty ? " " : "";
        } else {
            str =
                type == "expression"
                    ? previewValue
                        ? unescapeCString(previewValue)
                        : getExpressionPropertyInitalValue(
                              this.runtime,
                              this.widget,
                              value
                          )
                    : unescapeCString(value);
        }

        const strPtr = this.runtime.wasm.stringToNewUTF8(str);
        this.allocated.push(strPtr);
        return strPtr;
    }

    color(color: string | number) {
        const num =
            typeof color == "string" ? this.runtime.getColorNum(color) : color;

        const ptr = this.runtime.wasm._malloc(4);
        this.allocated.push(ptr);

        this.runtime.wasm.HEAP32[ptr >> 2] = num;

        return ptr;
    }

    image(image: string) {
        const bitmap = findBitmap(ProjectEditor.getProject(this.widget), image);
        if (!bitmap || !bitmap.image) {
            return 0;
        }
        return this.runtime.getBitmapPtr(bitmap);
    }

    or(...args: any) {
        let result = 0;
        for (const arg of args) {
            result |= arg;
        }
        return result;
    }

    get objectAccessor() {
        return this.obj;
    }

    createScreen() {
        if (this.customWidget) {
            this.obj = this.runtime.wasm._lvglCreateUserWidget(
                this.parentObj,
                this.customWidget.widgetIndex,
                this.customWidget.left,
                this.customWidget.top,
                this.customWidget.width,
                this.customWidget.height
            );
        } else {
            const rect = this.widget.getLvglCreateRect();

            this.obj = this.runtime.wasm._lvglCreateScreen(
                this.parentObj,
                this.runtime.getCreateWidgetIndex(ProjectEditor.getPage(this.widget)),
                rect.left,
                rect.top,
                rect.width,
                rect.height
            );
        }
    }

    createObject(createObjectFunction: string, ...args: any[]) {
        this.createObjectWithoutPosAndSize(createObjectFunction, ...args);

        const rect = this.widget.getLvglCreateRect();
        this.callObjectFunction("lv_obj_set_pos", rect.left, rect.top);
        this.callObjectFunction("lv_obj_set_size", rect.width, rect.height);
    }

    createObjectWithoutPosAndSize(createObjectFunction: string, ...args: any[]) {
        this.obj = this.callFreeFunction(
            createObjectFunction,
            this.parentObj,
            ...args
        );

        this.callObjectFunction(
            "setObjectIndex",
            this.runtime.getCreateWidgetIndex(this.widget)
        );
    }

    getObject(getObjectFunction: string, ...args: any[]) {
        this.obj = this.callFreeFunction(
            getObjectFunction,
            this.parentObj,
            ...args
        );
        this.callObjectFunction(
            "setObjectIndex",
            this.runtime.getCreateWidgetIndex(this.widget)
        );
    }

    getParentObject(getObjectFunction: string, ...args: any[]) {
        const parentObj = this.callFreeFunction(
            "lv_obj_get_parent",
            this.parentObj
        );

        this.obj = this.callFreeFunction(getObjectFunction, parentObj, ...args);
        this.callObjectFunction(
            "setObjectIndex",
            this.runtime.getCreateWidgetIndex(this.widget)
        );
    }

    callObjectFunction(func: string, ...args: any[]): any {
        const result = (this.runtime.wasm as any)["_" + func](
            this.obj,
            ...args
        );
        // console.log(
        //     "callObjectFunction",
        //     func,
        //     this.obj,
        //     ...args,
        //     "->",
        //     result
        // );
        return result;
    }

    callObjectFunctionWithAssignment(
        declType: string,
        declName: string,
        func: string,
        ...args: any[]
    ): any {
        return this.callObjectFunction(func, ...args);
    }

    callObjectFunctionWithAssignmentToStateVar(
        id: string,
        declType: string,
        declName: string,
        func: string,
        ...args: any[]
    ): any {
        return this.callObjectFunction(func, ...args);
    }

    callObjectFunctionInline(func: string, ...args: any[]): any {
        return this.callObjectFunction(func, ...args);
    }

    callFreeFunction(func: string, ...args: any[]): any {
        const result = (this.runtime.wasm as any)["_" + func](...args);
        // console.log("callFreeFunction", func, ...args, "->", result);
        return result;
    }

    callFreeFunctionWithAssignment(
        declType: string,
        declName: string,
        func: string,
        ...args: any[]
    ): any {
        return this.callFreeFunction(func, ...args);
    }

    callFreeFunctionInline(func: string, ...args: any[]): any {
        return this.callFreeFunction(func, ...args);
    }

    evalTextProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        return this.callFreeFunctionWithAssignment(
            declType,
            declName,
            "_evalTextProperty",
            this.flowState,
            this.componentIndex,
            this.propertyIndex,
            this.stringLiteral(errorMessage),
            0,
            0
        );
    }

    evalIntegerProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        return this.callFreeFunctionWithAssignment(
            declType,
            declName,
            "_evalIntegerProperty",
            this.flowState,
            this.componentIndex,
            this.propertyIndex,
            this.stringLiteral(errorMessage),
            0,
            0
        );
    }

    evalBooleanProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        return this.callFreeFunctionWithAssignment(
            declType,
            declName,
            "_evalBooleanProperty",
            this.flowState,
            this.componentIndex,
            this.propertyIndex,
            this.stringLiteral(errorMessage),
            0,
            0
        );
    }

    evalUnsignedIntegerProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        return this.callFreeFunctionWithAssignment(
            declType,
            declName,
            "_evalUnsignedIntegerProperty",
            this.flowState,
            this.componentIndex,
            this.propertyIndex,
            this.stringLiteral(errorMessage),
            0,
            0
        );
    }

    evalStringArrayPropertyAndJoin(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        return this.callFreeFunctionWithAssignment(
            declType,
            declName,
            "_evalStringArrayPropertyAndJoin",
            this.flowState,
            this.componentIndex,
            this.propertyIndex,
            this.stringLiteral(errorMessage),
            this.stringLiteral("\n"),
            0,
            0
        );
    }

    assignIntegerProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ): void {
        const propExpr = getExpressionPropertyData(
            this.runtime,
            this.widget,
            propertyName
        );

        if (propExpr) {
            this.callFreeFunction(
                "_assignIntegerProperty",
                this.flowState,
                propExpr.componentIndex,
                propExpr.propertyIndex,
                value,
                this.stringLiteral(errorMessage),
                0,
                0
            );
        }
    }

    assignBooleanProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ): void {
        const propExpr = getExpressionPropertyData(
            this.runtime,
            this.widget,
            propertyName
        );

        if (propExpr) {
            this.callFreeFunction(
                "_assignBooleanProperty",
                this.flowState,
                propExpr.componentIndex,
                propExpr.propertyIndex,
                value,
                this.stringLiteral(errorMessage),
                0,
                0
            );
        }
    }

    assignStringProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ): void {
        const propExpr = getExpressionPropertyData(
            this.runtime,
            this.widget,
            propertyName
        );

        if (propExpr) {
            this.callFreeFunction(
                "_assignStringProperty",
                this.flowState,
                propExpr.componentIndex,
                propExpr.propertyIndex,
                value,
                this.stringLiteral(errorMessage),
                0,
                0
            );
        }
    }

    addToTick(propertyName: string, callback: () => void) {
        const propExpr = getExpressionPropertyData(
            this.runtime,
            this.widget,
            propertyName
        );
        const widget = this.widget;
        const obj = this.obj;
        const flowState = this.runtime.lvglCreateContext.flowState;
        if (propExpr) {
            this.runtime.addTickCallback((_flowState: number) => {
                this.widget = widget;
                this.obj = obj;
                this.flowState = flowState;
                this.componentIndex = propExpr.componentIndex;
                this.propertyIndex = propExpr.propertyIndex;
                callback();
            });
        }
    }

    addToTickMulti(
        properties: {
            propertyName: string;
            callback: () => any;
        }[],
        finalCallback: (...args: any) => void
    ) {
        const widget = this.widget;
        const obj = this.obj;
        const flowState = this.runtime.lvglCreateContext.flowState;

        const propExprs = properties.map(property => {
            const propExpr = getExpressionPropertyData(
                this.runtime,
                this.widget,
                property.propertyName
            );

            return propExpr;
        });

        const allResultsHavePropExpr = propExprs.find(propExpr => propExpr == undefined) == undefined;
        if (allResultsHavePropExpr) {
            this.runtime.addTickCallback((_flowState: number) => {
                this.widget = widget;
                this.obj = obj;
                this.flowState = flowState;

                const args = properties.map((property, i) => {
                    if (propExprs[i]) {
                        this.componentIndex = propExprs[i].componentIndex;
                        this.propertyIndex = propExprs[i].propertyIndex;
                        return property.callback();
                    } else {
                        return {};
                    }
                });

                finalCallback(...args);
            });
        }
    }

    tickChangeStart() {
        this.runtime.tick_value_change_obj = this.obj;
    }
    tickChangeEnd() {
        this.runtime.tick_value_change_obj = 0;
    }

    assign(declType: string, declName: string, rhs: any) {
        return rhs;
    }

    if(a: any, callback: () => void, elseCallback?: () => void) {
        if (a) {
            callback();
        } else if (elseCallback) {
            elseCallback();
        }
    }

    ifNot(a: any, callback: () => void) {
        if (!a) {
            callback();
        }
    }

    ifStringNotEqual(a: any, b: any, callback: () => void) {
        if (this.callFreeFunction("strcmp", a, b) != 0) {
            callback();
        }
    }

    ifStringNotEqualN(a: any, b: any, n: any, callback: () => void) {
        if (this.callFreeFunction("strncmp", a, b, n) != 0) {
            callback();
        }
    }

    ifLess(a: any, b: any, callback: () => void) {
        if (a < b) {
            callback();
        }
    }

    ifNotEqual(a: any, b: any, callback: () => void) {
        if (a != b) {
            callback();
        }
    }

    buildColor<T>(
        object: IEezObject,
        color: string,
        getParams: () => T,
        callback: (color: string, params: T) => void,
        updateCallback: (color: any, params: T) => void
    ) {
        callback(color, undefined as any);

        const widget = this.widget;
        const obj = this.obj;

        let params = this.buildColorParams || getParams();

        this.runtime.lvglUpdateColor(color, (wasm, colorNum) => {
            this.widget = widget;
            this.obj = obj;
            updateCallback(colorNum, params);
        });
    }

    buildColor2<T>(
        object: IEezObject,
        color1: string,
        color2: string,
        getParams: () => T,
        callback: (color1: string, color2: string, params: T) => void,
        updateCallback: (color1: any, color2: any, params: T) => void
    ) {
        callback(color1, color2, undefined as T);

        const widget = this.widget;
        const obj = this.obj;

        let params = this.buildColorParams || getParams();

        this.runtime.lvglUpdateColor(color1, (wasm, colorNum) => {
            this.widget = widget;
            this.obj = obj;
            updateCallback(colorNum, undefined, params);
        });
        this.runtime.lvglUpdateColor(color2, (wasm, colorNum) => {
            this.obj = obj;
            updateCallback(undefined, colorNum, params);
        });
    }

    genStateVar(id: string, type: string, prefixName: string) {
        return undefined as any;
    }

    assingToStateVar(varName: string, value: string) {
        this.buildColorParams = value;
    }

    blockStart(param: any) {}

    blockEnd(param: any) {}

    addEventHandler(
        eventName: string,
        callback: (event: any, tick_value_change_obj: any) => void
    ) {
        const widget = this.widget;
        const obj = this.obj;
        const flowState = this.runtime.lvglCreateContext.flowState;

        this.pageRuntime.addEventHandler(this.obj, eventName == "CHECKED" || eventName == "UNCHECKED" ? "VALUE_CHANGED" : eventName, event => {
            this.widget = widget;
            this.obj = obj;
            this.flowState = flowState;
            callback(event, this.runtime.tick_value_change_obj);
        });
    }


    postPageExecute(callback: () => void) {
        const widget = this.widget;
        const obj = this.obj;
        this.pageRuntime.addPostCreateCallback(() => {
            this.widget = widget;
            this.obj = obj;
            callback();
        });
    }

    postWidgetExecute(callback: () => void) {
        this.postWidgetExecuteCallbacks.push(callback);
    }
}

// 构建（生成 C 代码）时的 LVGL 代码生成实现
export class BuildLVGLCode implements LVGLCode {
    constructor(public build: LVGLBuild) {}

    widget: LVGLWidget;

    isTick = false; // 是否处于 tick 回调中
    componentIndex: number;
    propertyIndex: number;

    noGoodNameCallbacks: (() => void)[] = [];

    startWidget(widget: LVGLWidget) {
        this.widget = widget;
    }

    endWidget() {
        for (const callback of this.noGoodNameCallbacks) {
            callback();
        }
        this.noGoodNameCallbacks = [];
    }

    get project() {
        return this.build.project;
    }

    get pageRuntime() {
        return undefined;
    }

    get lvglBuild() {
        return this.build;
    }

    get isV9(): boolean {
        return this.build.isV9;
    }

    isLVGLVersion(prefixes: string[]): boolean {
        return this.build.isLVGLVersion(prefixes);
    }

    get hasFlowSupport() {
        return this.build.assets.projectStore.projectTypeTraits.hasFlowSupport;
    }

    get screensLifetimeSupport() {
        return this.build.project.settings.build.screensLifetimeSupport;
    }

    get flowState() {
        return "flowState";
    }

    get lv_event_get_target() {
        return this.isV9 ? "lv_event_get_target_obj" : "lv_event_get_target";
    }

    constant(constant: string) {
        return constant;
    }

    stringProperty(
        type: string,
        value: string,
        previewValue?: string,
        nonEmpty?: boolean
    ) {
        if (type == "literal") {
            return this.stringLiteral(value);
        }

        if (type == "translated-literal") {
            return `_(${this.stringLiteral(value)})`;
        }

        return nonEmpty ? `" "` : `""`;
    }

    stringLiteral(str: string) {
        return escapeCString(str ?? "");
    }

    color(color: string | number) {
        if (typeof color == "string" && color.startsWith("lv_color")) {
            return color;
        }
        return `lv_color_hex(${color})`;
    }

    image(image: string) {
        const bitmap = findBitmap(ProjectEditor.getProject(this.widget), image);

        return bitmap && bitmap.image
            ? `${this.build.getImageAccessor(bitmap)}`
            : 0;
    }

    or(...args: any) {
        return args.join(" | ");
    }

    get objectAccessor() {
        return this.build.getLvglObjectAccessor(this.widget);
    }

    createScreen() {
        this.build.line(`lv_obj_t *obj = lv_obj_create(0);`);

        this.build.buildWidgetAssign(this.widget);
        this.build.buildWidgetSetPosAndSize(this.widget);

        return "obj";
    }

    createObject(createObjectFunction: string, ...args: any[]) {
        this.createObjectWithoutPosAndSize(createObjectFunction, ...args);
        
        this.build.buildWidgetSetPosAndSize(this.widget);

        return "obj";
    }

    createObjectWithoutPosAndSize(createObjectFunction: string, ...args: any[]) {
        this.build.line(
            `lv_obj_t *obj = ${createObjectFunction}(${[
                "parent_obj",
                ...args
            ].join(", ")});`
        );

        this.build.buildWidgetAssign(this.widget);

        return "obj";
    }

    getObject(getObjectFunction: string, ...args: any[]) {
        this.build.line(
            `lv_obj_t *obj = ${getObjectFunction}(${[
                "parent_obj",
                ...args
            ].join(", ")});`
        );

        this.build.buildWidgetAssign(this.widget);

        return "obj";
    }

    getParentObject(getObjectFunction: string, ...args: any[]) {
        this.build.line(
            `lv_obj_t *obj = ${getObjectFunction}(${[
                "lv_obj_get_parent(parent_obj)",
                ...args
            ].join(", ")});`
        );

        this.build.buildWidgetAssign(this.widget);

        return "obj";
    }

    callObjectFunction(func: string, ...args: any[]): any {
        this.build.line(
            `${func}(${[
                this.isTick ? this.objectAccessor : "obj",
                ...args
            ].join(", ")});`
        );
        return undefined;
    }

    callObjectFunctionWithAssignment(
        declType: string,
        declName: string,
        func: string,
        ...args: any[]
    ): any {
        this.build.line(
            `${declType}${
                declType.endsWith("*") ? "" : " "
            }${declName} = ${func}(${[
                this.isTick ? this.objectAccessor : "obj",
                ...args
            ].join(", ")});`
        );
        return declName;
    }

    callObjectFunctionWithAssignmentToStateVar(
        id: string,
        declType: string,
        declNamePrefix: string,
        func: string,
        ...args: any[]
    ): any {
        const stateVar = this.genStateVar(id, declType, declNamePrefix);

        this.build.line(
            `${stateVar} = ${func}(${[
                this.isTick ? this.objectAccessor : "obj",
                ...args
            ].join(", ")});`
        );

        return stateVar;
    }

    callObjectFunctionInline(func: string, ...args: any[]): any {
        return `${func}(${[
            this.isTick ? this.objectAccessor : "obj",
            ...args
        ].join(", ")})`;
    }

    callFreeFunction(func: string, ...args: any[]): any {
        this.build.line(`${func}(${args.join(", ")});`);
        return undefined;
    }

    callFreeFunctionWithAssignment(
        declType: string,
        declName: string,
        func: string,
        ...args: any[]
    ): any {
        this.build.line(
            `${declType}${
                declType.endsWith("*") ? "" : " "
            }${declName} = ${func}(${args.join(", ")});`
        );
        return declName;
    }

    callFreeFunctionInline(func: string, ...args: any[]): any {
        return `${func}(${args.join(", ")})`;
    }

    getVariableWithAssignment(
        declType: string,
        declName: string,
        variableName: string
    ) {
        this.build.line(
            `${declType}${
                declType.endsWith("*") ? "" : " "
            }${declName} = ${this.build.getVariableGetterFunctionName(
                variableName
            )}();`
        );
        return declName;
    }

    setVariable(variableName: string, value: any) {
        this.build.line(
            `${this.build.getVariableSetterFunctionName(variableName)}(value);`
        );
    }

    evalTextProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            return this.callFreeFunctionWithAssignment(
                declType,
                declName,
                "evalTextProperty",
                "flowState",
                this.componentIndex,
                this.propertyIndex,
                this.stringLiteral(errorMessage)
            );
        } else {
            return this.getVariableWithAssignment(
                declType,
                declName,
                propertyValue
            );
        }
    }

    evalIntegerProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            return this.callFreeFunctionWithAssignment(
                declType,
                declName,
                "evalIntegerProperty",
                "flowState",
                this.componentIndex,
                this.propertyIndex,
                this.stringLiteral(errorMessage)
            );
        } else {
            return this.getVariableWithAssignment(
                declType,
                declName,
                propertyValue
            );
        }
    }

    evalBooleanProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            return this.callFreeFunctionWithAssignment(
                declType,
                declName,
                "evalBooleanProperty",
                "flowState",
                this.componentIndex,
                this.propertyIndex,
                this.stringLiteral(errorMessage)
            );
        } else {
            return this.getVariableWithAssignment(
                declType,
                declName,
                propertyValue
            );
        }
    }

    evalUnsignedIntegerProperty(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            return this.callFreeFunctionWithAssignment(
                declType,
                declName,
                "evalUnsignedIntegerProperty",
                "flowState",
                this.componentIndex,
                this.propertyIndex,
                this.stringLiteral(errorMessage)
            );
        } else {
            return this.getVariableWithAssignment(
                declType,
                declName,
                propertyValue
            );
        }
    }

    evalStringArrayPropertyAndJoin(
        declType: string,
        declName: string,
        propertyValue: string,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            return this.callFreeFunctionWithAssignment(
                declType,
                declName,
                "evalStringArrayPropertyAndJoin",
                "flowState",
                this.componentIndex,
                this.propertyIndex,
                this.stringLiteral(errorMessage),
                '"\\n"'
            );
        } else {
            return this.getVariableWithAssignment(
                declType,
                declName,
                propertyValue
            );
        }
    }

    assignIntegerProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            const componentIndex = this.build.assets.getComponentIndex(
                this.widget
            );
            const propertyIndex = this.build.assets.getComponentPropertyIndex(
                this.widget,
                propertyName
            );

            return this.callFreeFunction(
                "assignIntegerProperty",
                "flowState",
                componentIndex,
                propertyIndex,
                value,
                this.stringLiteral(errorMessage)
            );
        } else {
            return this.setVariable(propertyValue, value);
        }
    }

    assignBooleanProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            const componentIndex = this.build.assets.getComponentIndex(
                this.widget
            );
            const propertyIndex = this.build.assets.getComponentPropertyIndex(
                this.widget,
                propertyName
            );

            return this.callFreeFunction(
                "assignBooleanProperty",
                "flowState",
                componentIndex,
                propertyIndex,
                value,
                this.stringLiteral(errorMessage)
            );
        } else {
            return this.setVariable(propertyValue, value);
        }
    }

    assignStringProperty(
        propertyName: string,
        propertyValue: string,
        value: any,
        errorMessage: any
    ) {
        if (this.hasFlowSupport) {
            const componentIndex = this.build.assets.getComponentIndex(
                this.widget
            );
            const propertyIndex = this.build.assets.getComponentPropertyIndex(
                this.widget,
                propertyName
            );

            return this.callFreeFunction(
                "assignStringProperty",
                "flowState",
                componentIndex,
                propertyIndex,
                value,
                this.stringLiteral(errorMessage)
            );
        } else {
            return this.setVariable(propertyValue, value);
        }
    }

    addToTick(propertyName: string, callback: () => void) {
        const build = this.build;

        const widget = this.widget;

        build.addTickCallback(() => {
            this.widget = widget;

            build.blockStart(`{`);

            if (this.hasFlowSupport) {
                this.componentIndex = this.build.assets.getComponentIndex(
                    this.widget
                );
                this.propertyIndex =
                    this.build.assets.getComponentPropertyIndex(
                        this.widget,
                        propertyName
                    );
            }

            this.isTick = true;

            callback();

            this.isTick = false;

            build.blockEnd(`}`);
        });
    }

    addToTickMulti(
        properties: {
            propertyName: string;
            callback: () => any;
        }[],
        finalCallback: (...args: any) => void
    ) {
        const build = this.build;

        const widget = this.widget;

        build.addTickCallback(() => {
            this.widget = widget;

            build.blockStart(`{`);

            this.isTick = true;

            const args = properties.map(property => {
                if (this.hasFlowSupport) {
                    this.componentIndex = this.build.assets.getComponentIndex(
                        this.widget
                    );
                    this.propertyIndex =
                        this.build.assets.getComponentPropertyIndex(
                            this.widget,
                            property.propertyName
                        );
                }

                return property.callback();
            });

            finalCallback(...args);

            this.isTick = false;

            build.blockEnd(`}`);
        });
    }

    tickChangeStart() {
        this.build.line(`tick_value_change_obj = ${this.objectAccessor};`);
    }

    tickChangeEnd() {
        this.build.line(`tick_value_change_obj = NULL;`);
    }

    assign(declType: string, declName: string, rhs: any) {
        this.build.line(
            `${declType}${
                declType.endsWith("*") ? "" : " "
            }${declName} = ${rhs};`
        );
        return declName;
    }

    if(a: any, callback: () => void, elseCallback?: () => void) {
        const build = this.build;

        build.blockStart(`if (${a}) {`);
        callback();
        if (elseCallback) {
            build.unindent();
            build.line("} else {");
            build.indent();
            elseCallback();
        }
        build.blockEnd(`}`);
    }

    ifNot(a: any, callback: () => void) {
        const build = this.build;

        build.blockStart(`if (!${a}) {`);
        callback();
        build.blockEnd(`}`);
    }

    ifStringNotEqual(a: any, b: any, callback: () => void) {
        const build = this.build;

        build.blockStart(`if (strcmp(${a}, ${b}) != 0) {`);
        callback();
        build.blockEnd(`}`);
    }

    ifStringNotEqualN(a: any, b: any, n: any, callback: () => void) {
        const build = this.build;

        build.blockStart(`if (strncmp(${a}, ${b}, ${n}) != 0) {`);
        callback();
        build.blockEnd(`}`);
    }

    ifLess(a: any, b: any, callback: () => void) {
        const build = this.build;

        build.blockStart(`if (${a} < ${b}) {`);
        callback();
        build.blockEnd(`}`);
    }

    ifNotEqual(a: any, b: any, callback: () => void) {
        const build = this.build;

        build.blockStart(`if (${a} != ${b}) {`);
        callback();
        build.blockEnd(`}`);
    }

    buildColor<T>(
        object: IEezObject,
        color: string,
        getParams: () => T,
        callback: (color: string, params: T) => void,
        updateCallback: (color: any, params: T) => void
    ) {
        this.build.buildColor(
            object,
            color,
            getParams,
            callback,
            updateCallback
        );
    }

    buildColor2<T>(
        object: IEezObject,
        color1: string,
        color2: string,
        getParams: () => T,
        callback: (color1: string, color2: string, params: T) => void,
        updateCallback: (color1: any, color2: any, params: T) => void
    ) {
        this.build.buildColor2(
            object,
            color1,
            color2,
            getParams,
            callback,
            updateCallback
        );
    }

    genStateVar(id: string, type: string, prefixName: string) {
        return this.build.genStateVar(id, type, prefixName);
    }

    assingToStateVar(varName: string, value: string) {
        this.build.assingToStateVar(varName, value);
    }

    blockStart(param: any) {
        this.build.blockStart(param);
    }

    blockEnd(param: any) {
        this.build.blockEnd(param);
    }

    addEventHandler(
        eventName: string,
        callback: (event: any, tick_value_change_obj: any) => void
    ) {
        const widget = this.widget;
        const componentIndex = this.componentIndex;
        const propertyIndex = this.propertyIndex;

        this.build.addEventHandler(this.widget, eventName, () => {
            this.widget = widget;
            this.componentIndex = componentIndex;
            this.propertyIndex = propertyIndex;

            callback("e", "tick_value_change_obj");
        });
    }

    postPageExecute(callback: () => void) {
        this.build.postBuildAdd(callback);
    }

    postWidgetExecute(callback: () => void) {
        this.noGoodNameCallbacks.push(callback);
    }
}
