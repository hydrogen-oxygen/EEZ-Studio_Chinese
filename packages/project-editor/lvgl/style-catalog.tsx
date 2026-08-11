import React from "react";
import { observer } from "mobx-react";
import Select from "react-select";

import { isArray } from "eez-studio-shared/util";

import {
    EezObject,
    EnumItem,
    IEezObject,
    ProjectType,
    PropertyInfo,
    PropertyProps,
    PropertyType
} from "project-editor/core/object";

import { ProjectStore } from "project-editor/store";

import {
    LVGLStylePropCode,
    LVGL_STYLE_PROP_CODES,
    LV_FLEX_ALIGN_CENTER,
    LV_FLEX_ALIGN_END,
    LV_FLEX_ALIGN_SPACE_AROUND,
    LV_FLEX_ALIGN_SPACE_BETWEEN,
    LV_FLEX_ALIGN_SPACE_EVENLY,
    LV_FLEX_ALIGN_START,
    LV_FLEX_FLOW_COLUMN,
    LV_FLEX_FLOW_COLUMN_REVERSE,
    LV_FLEX_FLOW_COLUMN_WRAP,
    LV_FLEX_FLOW_COLUMN_WRAP_REVERSE,
    LV_FLEX_FLOW_ROW,
    LV_FLEX_FLOW_ROW_REVERSE,
    LV_FLEX_FLOW_ROW_WRAP,
    LV_FLEX_FLOW_ROW_WRAP_REVERSE,
    LV_GRID_ALIGN_CENTER,
    LV_GRID_ALIGN_END,
    LV_GRID_ALIGN_SPACE_AROUND,
    LV_GRID_ALIGN_SPACE_BETWEEN,
    LV_GRID_ALIGN_SPACE_EVENLY,
    LV_GRID_ALIGN_START,
    LV_GRID_ALIGN_STRETCH,
    LV_LAYOUT_FLEX,
    LV_LAYOUT_GRID,
    LV_LAYOUT_NONE
} from "project-editor/lvgl/lvgl-constants";
import { ProjectEditor } from "project-editor/project-editor-interface";
import { getEnumItems } from "project-editor/ui-components/PropertyGrid/utils";
import { settingsController } from "home/settings";
import { registerSystemEnum } from "project-editor/features/variable/value-type";
import { getLvglCoord } from "project-editor/lvgl/lvgl-versions";

////////////////////////////////////////////////////////////////////////////////

export const BUILT_IN_FONTS = [
    "MONTSERRAT_8",
    "MONTSERRAT_10",
    "MONTSERRAT_12",
    "MONTSERRAT_14",
    "MONTSERRAT_16",
    "MONTSERRAT_18",
    "MONTSERRAT_20",
    "MONTSERRAT_22",
    "MONTSERRAT_24",
    "MONTSERRAT_26",
    "MONTSERRAT_28",
    "MONTSERRAT_30",
    "MONTSERRAT_32",
    "MONTSERRAT_34",
    "MONTSERRAT_36",
    "MONTSERRAT_38",
    "MONTSERRAT_40",
    "MONTSERRAT_42",
    "MONTSERRAT_44",
    "MONTSERRAT_46",
    "MONTSERRAT_48"
];

////////////////////////////////////////////////////////////////////////////////

interface LVGLStyleProp {
    code: LVGLStylePropCode;
    description: string;
    defaultValue: string;
    inherited: boolean;
    layout: boolean;
    extDraw: boolean;
    valueRead?: (value: number) => string;
    valueToNum?: (value: string, projectStore: ProjectStore) => number | number[];
    valueBuild?: (value: string) => string;
    buildPrefix?: string;
    isInt16Array?: (projectStore: ProjectStore) => boolean;
}

export type LVGLPropertyInfo = PropertyInfo & {
    lvglStyleProp: LVGLStyleProp;
};

export class PropertyValueHolder extends EezObject {
    [propertyName: string]: any;

    constructor(
        public projectStore: ProjectStore,
        propertyName: string,
        propertyValue: any
    ) {
        super();
        this[propertyName] = propertyValue;
    }
}

////////////////////////////////////////////////////////////////////////////////

function makeEnumPropertyInfo(
    name: string,
    displayName: string,
    lvglStyleProp: LVGLStyleProp,
    enumItemToCodeOrStringArray: { [key: string]: number } | string[],
    buildPrefix: string,
    propertyGridColumnComponent?: React.ComponentType<PropertyProps>
): LVGLPropertyInfo {
    let enumItemToCode: { [key: string]: number };
    if (isArray(enumItemToCodeOrStringArray)) {
        enumItemToCode = {};
        for (let i = 0; i < enumItemToCodeOrStringArray.length; i++) {
            enumItemToCode[enumItemToCodeOrStringArray[i]] = i;
        }
    } else {
        enumItemToCode = enumItemToCodeOrStringArray;
    }

    //
    registerSystemEnum({
        name: buildPrefix.slice(0, -1),
        members: Object.keys(enumItemToCode).map((key) => ({
            name: key,
            value: enumItemToCode[key]
        })),
        projectTypes: [ProjectType.LVGL]
    });

    //
    const codeToEnumItem: { [code: string]: string } = {};

    Object.keys(enumItemToCode).forEach(
        enumItem =>
            (codeToEnumItem[enumItemToCode[enumItem].toString()] = enumItem)
    );

    return {
        name,
        displayName,
        type: PropertyType.Enum,
        enumItems: Object.keys(enumItemToCode).map(id => ({
            id,
            label: id
        })),
        enumDisallowUndefined: true,
        propertyGridColumnComponent,
        lvglStyleProp: Object.assign(lvglStyleProp, {
            buildPrefix,
            enumItemToCodeOrStringArray,
            valueRead: lvglStyleProp.valueRead
                ? lvglStyleProp.valueRead
                : (value: number) => codeToEnumItem[value.toString()],
            valueToNum: lvglStyleProp.valueToNum
                ? lvglStyleProp.valueToNum
                : (value: string) => enumItemToCode[value.toString()],
            valueBuild: lvglStyleProp.valueBuild
                ? lvglStyleProp.valueBuild
                : (value: string) => buildPrefix + value
        })
    };
}

////////////////////////////////////////////////////////////////////////////////

//
// 位置和大小
//

const width_property_info: LVGLPropertyInfo = {
    name: "width",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_WIDTH,
        description:
            "设置对象的宽度。可以使用像素、百分比和 LV_SIZE_CONTENT 值。百分比值相对于父对象内容区域的宽度。",
        defaultValue: "Widget dependent", // 取决于部件
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const height_property_info: LVGLPropertyInfo = {
    name: "height",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_HEIGHT,
        description:
            "设置对象的高度。可以使用像素、百分比和 LV_SIZE_CONTENT。百分比值相对于父对象内容区域的高度。",
        defaultValue: "Widget dependent", // 取决于部件
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const min_width_property_info: LVGLPropertyInfo = {
    name: "min_width",
    displayName: "最小宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MIN_WIDTH,
        description:
            "设置最小宽度。可以使用像素和百分比值。百分比值相对于父对象内容区域的宽度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const max_width_property_info: LVGLPropertyInfo = {
    name: "max_width",
    displayName: "最大宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MAX_WIDTH,
        description:
            "设置最大宽度。可以使用像素和百分比值。百分比值相对于父对象内容区域的宽度。",
        defaultValue: "LV_COORD_MAX",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const min_height_property_info: LVGLPropertyInfo = {
    name: "min_height",
    displayName: "最小高度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MIN_HEIGHT,
        description:
            "设置最小高度。可以使用像素和百分比值。百分比值相对于父对象内容区域的宽度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
const max_height_property_info: LVGLPropertyInfo = {
    name: "max_height",
    displayName: "最大高度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MAX_HEIGHT,
        description:
            "设置最大高度。可以使用像素和百分比值。百分比值相对于父对象内容区域的高度。",
        defaultValue: "LV_COORD_MAX",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
const length_property_info: LVGLPropertyInfo = {
    name: "length",
    displayName: "长度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LENGTH,
        description: "",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const x_property_info: LVGLPropertyInfo = {
    name: "x",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_X,
        description:
            "根据所设置的对齐方式设置对象的 X 坐标。可以使用像素和百分比值。百分比值相对于父对象内容区域的宽度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const y_property_info: LVGLPropertyInfo = {
    name: "y",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_Y,
        description:
            "根据所设置的对齐方式设置对象的 Y 坐标。可以使用像素和百分比值。百分比值相对于父对象内容区域的高度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const align_property_info = makeEnumPropertyInfo(
    "align",
    "对齐方式",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ALIGN,
        description:
            "设置对齐方式，它指明 X 和 Y 坐标应相对于父对象的哪个点进行解释。可能的值有：LV_ALIGN_DEFAULT、LV_ALIGN_TOP_LEFT/MID/RIGHT、LV_ALIGN_BOTTOM_LEFT/MID/RIGHT、LV_ALIGN_LEFT/RIGHT_MID、LV_ALIGN_CENTER。LV_ALIGN_DEFAULT 表示在 LTR 基础方向下为 LV_ALIGN_TOP_LEFT，在 RTL 基础方向下为 LV_ALIGN_TOP_RIGHT。",
        defaultValue: "LV_ALIGN_DEFAULT",
        inherited: false,
        layout: true,
        extDraw: false
    },
    [
        "DEFAULT",       // 默认
        "TOP_LEFT",      // 左上
        "TOP_MID",       // 上中
        "TOP_RIGHT",     // 右上
        "BOTTOM_LEFT",   // 左下
        "BOTTOM_MID",    // 下中
        "BOTTOM_RIGHT",  // 右下
        "LEFT_MID",      // 左中
        "RIGHT_MID",     // 右中
        "CENTER",        // 居中

        "OUT_TOP_LEFT",      // 外部左上
        "OUT_TOP_MID",       // 外部上中
        "OUT_TOP_RIGHT",     // 外部右上
        "OUT_BOTTOM_LEFT",   // 外部左下
        "OUT_BOTTOM_MID",    // 外部下中
        "OUT_BOTTOM_RIGHT",  // 外部右下
        "OUT_LEFT_TOP",      // 外部左顶
        "OUT_LEFT_MID",      // 外部左中
        "OUT_LEFT_BOTTOM",   // 外部左底
        "OUT_RIGHT_TOP",     // 外部右顶
        "OUT_RIGHT_MID",     // 外部右中
        "OUT_RIGHT_BOTTOM"   // 外部右底
    ],
    "LV_ALIGN_"
);

const transform_width_property_info: LVGLPropertyInfo = {
    name: "transform_width",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_WIDTH,
        description:
            "使用此值在两侧加宽对象。可以使用像素和百分比（使用 lv_pct(x)）值。百分比值相对于对象的宽度。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};

const transform_height_property_info: LVGLPropertyInfo = {
    name: "transform_height",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_HEIGHT,
        description:
            "使用此值在两侧加高对象。可以使用像素和百分比（使用 lv_pct(x)）值。百分比值相对于对象的高度。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};

const translate_x_property_info: LVGLPropertyInfo = {
    name: "translate_x",
    displayName: "X 平移",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSLATE_X,
        description:
            "在 X 方向上以此值移动对象。在布局、对齐和其他定位之后应用。可以使用像素和百分比（使用 lv_pct(x)）值。百分比值相对于对象的宽度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const translate_y_property_info: LVGLPropertyInfo = {
    name: "translate_y",
    displayName: "Y 平移",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSLATE_Y,
        description:
            "在 Y 方向上以此值移动对象。在布局、对齐和其他定位之后应用。可以使用像素和百分比（使用 lv_pct(x)）值。百分比值相对于对象的高度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

export const transform_zoom_property_info: LVGLPropertyInfo = {
    name: "transform_zoom",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_ZOOM,
        description:
            "缩放对象。值 256（或 LV_IMG_ZOOM_NONE）表示正常大小，128 表示一半大小，512 表示两倍大小，依此类推。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

export const transform_scale_x_property_info: LVGLPropertyInfo = {
    name: "transform_scale_x",
    displayName: "变换缩放 X",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_SCALE_X,
        description:
            "水平缩放对象。值 256（或 LV_IMG_ZOOM_NONE）表示正常大小，128 表示一半大小，512 表示两倍大小，依此类推。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

export const transform_scale_y_property_info: LVGLPropertyInfo = {
    name: "transform_scale_y",
    displayName: "变换缩放 Y",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_SCALE_Y,
        description:
            "垂直缩放对象。值 256（或 LV_IMG_ZOOM_NONE）表示正常大小，128 表示一半大小，512 表示两倍大小，依此类推。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

export const transform_angle_property_info: LVGLPropertyInfo = {
    name: "transform_angle",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_ANGLE,
        description:
            "旋转对象。该值以 0.1 度为单位进行解释。例如 450 表示 45 度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

export const transform_rotation_property_info: LVGLPropertyInfo = {
    name: "transform_rotation",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_ROTATION,
        description:
            "旋转对象。该值以 0.1 度为单位进行解释。例如 450 表示 45 度。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const transform_pivot_x_property_info: LVGLPropertyInfo = {
    name: "transform_pivot_x",
    displayName: "变换枢轴 X",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_PIVOT_X,
        description:
            "为变换设置枢轴点的 X 坐标。相对于对象的左上角。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const transform_pivot_y_property_info: LVGLPropertyInfo = {
    name: "transform_pivot_y",
    displayName: "变换枢轴 Y",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_PIVOT_Y,
        description:
            "为变换设置枢轴点的 Y 坐标。相对于对象的左上角。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

const transform_skew_x_property_info: LVGLPropertyInfo = {
    name: "transform_skew_x",
    displayName: "变换倾斜 X",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_SKEW_X,
        description: "",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const transform_skew_y_property_info: LVGLPropertyInfo = {
    name: "transform_skew_y",
    displayName: "变换倾斜 Y",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSFORM_SKEW_Y,
        description: "",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

//
// 布局
//

const layout_property_info = makeEnumPropertyInfo(
    "layout",
    "布局",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LAYOUT,
        description:
            "设置对象的布局。子对象将根据为布局设置的策略进行重新定位和调整大小。可能的值请参阅布局文档。",
        defaultValue: "LV_FLEX_FLOW_ROW",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        NONE: LV_LAYOUT_NONE,  // 无布局
        FLEX: LV_LAYOUT_FLEX,  // 使用弹性布局
        GRID: LV_LAYOUT_GRID   // 使用网格布局
    },
    "LV_LAYOUT_"
);

const flex_flow_property_info = makeEnumPropertyInfo(
    "flex_flow",
    "弹性流向",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_FLEX_FLOW,
        description: "确定所使用的弹性布局类型。",
        defaultValue: "LV_FLEX_FLOW_ROW",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        ROW: LV_FLEX_FLOW_ROW,                    // 将子对象排列成一行且不换行
        COLUMN: LV_FLEX_FLOW_COLUMN,              // 将子对象排列成一列且不换行
        ROW_WRAP: LV_FLEX_FLOW_ROW_WRAP,          // 将子对象排列成一行并允许换行
        ROW_REVERSE: LV_FLEX_FLOW_ROW_REVERSE,    // 将子对象排列成一列并允许换行
        ROW_WRAP_REVERSE: LV_FLEX_FLOW_ROW_WRAP_REVERSE, // 将子对象排列成一行且不换行但顺序反转
        COLUMN_WRAP: LV_FLEX_FLOW_COLUMN_WRAP,    // 将子对象排列成一列且不换行但顺序反转
        COLUMN_REVERSE: LV_FLEX_FLOW_COLUMN_REVERSE, // 将子对象排列成一行并允许换行但顺序反转
        COLUMN_WRAP_REVERSE: LV_FLEX_FLOW_COLUMN_WRAP_REVERSE // 将子对象排列成一列并允许换行但顺序反转
    },
    "LV_FLEX_FLOW_"
);

const flex_main_place_property_info = makeEnumPropertyInfo(
    "flex_main_place",
    "弹性主轴位置",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_FLEX_MAIN_PLACE,
        description:
            "确定如何在主轴上的轨道中分配项目。",
        defaultValue: "LV_FLEX_ALIGN_START",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        START: LV_FLEX_ALIGN_START,       // 水平方向为左、垂直方向为顶（默认）
        END: LV_FLEX_ALIGN_END,           // 水平方向为右、垂直方向为底
        CENTER: LV_FLEX_ALIGN_CENTER,     // 简单居中
        SPACE_EVENLY: LV_FLEX_ALIGN_SPACE_EVENLY, // 项目分布使得任意两个项目之间（以及与边缘）的间距相等。不适用于 track_cross_place。
        SPACE_AROUND: LV_FLEX_ALIGN_SPACE_AROUND, // 项目在轨道中均匀分布，周围间距相等。请注意，视觉上间距并不相等，因为所有项目两侧的空间相同。第一个项目与容器边缘之间有一个单位的空间，但与下一个项目之间有两个单位的空间，因为下一个项目自身也有对应的间距。不适用于 track_cross_place。
        SPACE_BETWEEN: LV_FLEX_ALIGN_SPACE_BETWEEN // 项目在轨道中均匀分布：第一个项目在起始线上，最后一个项目在结束线上。不适用于 track_cross_place。
    },
    "LV_FLEX_ALIGN_"
);

const flex_cross_place_property_info = makeEnumPropertyInfo(
    "flex_cross_place",
    "弹性交叉位置",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_FLEX_CROSS_PLACE,
        description:
            "确定如何在交叉轴上的轨道中分配项目。",
        defaultValue: "LV_FLEX_ALIGN_START",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        START: LV_FLEX_ALIGN_START,   // 水平方向为左、垂直方向为顶（默认）
        END: LV_FLEX_ALIGN_END,       // 水平方向为右、垂直方向为底
        CENTER: LV_FLEX_ALIGN_CENTER  // 简单居中
    },
    "LV_FLEX_ALIGN_"
);

const flex_track_place_property_info = makeEnumPropertyInfo(
    "flex_track_place",
    "弹性轨道位置",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_FLEX_TRACK_PLACE,
        description: "确定如何分配轨道。",
        defaultValue: "LV_FLEX_ALIGN_START",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        START: LV_FLEX_ALIGN_START,       // 水平方向为左、垂直方向为顶（默认）
        END: LV_FLEX_ALIGN_END,           // 水平方向为右、垂直方向为底
        CENTER: LV_FLEX_ALIGN_CENTER,     // 简单居中
        SPACE_EVENLY: LV_FLEX_ALIGN_SPACE_EVENLY, // 项目分布使得任意两个项目之间（以及与边缘）的间距相等。不适用于 track_cross_place。
        SPACE_AROUND: LV_FLEX_ALIGN_SPACE_AROUND, // 项目在轨道中均匀分布，周围间距相等。请注意，视觉上间距并不相等，因为所有项目两侧的空间相同。第一个项目与容器边缘之间有一个单位的空间，但与下一个项目之间有两个单位的空间，因为下一个项目自身也有对应的间距。不适用于 track_cross_place。
        SPACE_BETWEEN: LV_FLEX_ALIGN_SPACE_BETWEEN // 项目在轨道中均匀分布：第一个项目在起始线上，最后一个项目在结束线上。不适用于 track_cross_place。
    },
    "LV_FLEX_ALIGN_"
);

const flex_grow_property_info: LVGLPropertyInfo = {
    name: "flex_grow",
    displayName: "弹性增长",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_FLEX_GROW,
        description:
            "弹性增长可用于让一个或多个子对象填满轨道上的可用空间。当多个子对象设置了增长参数时，可用空间将按增长值成比例分配。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const grid_column_align_property_info: LVGLPropertyInfo = makeEnumPropertyInfo(
    "grid_column_align",
    "网格列对齐",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_COLUMN_ALIGN,
        description: "定义如何分配列。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        START: LV_GRID_ALIGN_START,       // 起始
        CENTER: LV_GRID_ALIGN_CENTER,     // 居中
        END: LV_GRID_ALIGN_END,           // 结束
        STRETCH: LV_GRID_ALIGN_STRETCH,   // 拉伸
        SPACE_EVENLY: LV_GRID_ALIGN_SPACE_EVENLY, // 均匀分布
        SPACE_AROUND: LV_GRID_ALIGN_SPACE_AROUND, // 周围分布
        SPACE_BETWEEN: LV_GRID_ALIGN_SPACE_BETWEEN // 之间分布
    },
    "LV_GRID_ALIGN_"
);

const grid_row_align_property_info: LVGLPropertyInfo = makeEnumPropertyInfo(
    "grid_row_align",
    "网格行对齐",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_ROW_ALIGN,
        description: "定义如何分配列。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        START: LV_GRID_ALIGN_START,       // 起始
        CENTER: LV_GRID_ALIGN_CENTER,     // 居中
        END: LV_GRID_ALIGN_END,           // 结束
        STRETCH: LV_GRID_ALIGN_STRETCH,   // 拉伸
        SPACE_EVENLY: LV_GRID_ALIGN_SPACE_EVENLY, // 均匀分布
        SPACE_AROUND: LV_GRID_ALIGN_SPACE_AROUND, // 周围分布
        SPACE_BETWEEN: LV_GRID_ALIGN_SPACE_BETWEEN // 之间分布
    },
    "LV_GRID_ALIGN_"
);

function dscArrayValueRead(value: number) {
    return "";
}

function dscArrayValueToNum(value: string, projectStore: ProjectStore) {
    const { LV_COORD_MAX } = getLvglCoord(projectStore.project);
    const LV_GRID_CONTENT = LV_COORD_MAX - 101;
    function LV_GRID_FR(x: number) {
        return LV_COORD_MAX - 100 + x;
    }
    const LV_GRID_TEMPLATE_LAST = LV_COORD_MAX;

    let arrStr = value.trim().split(value.indexOf(",") !== -1 ? "," : " ");
    let arr: number[] = [];

    for (let i = 0; i < arrStr.length; i++) {
        const colStr = arrStr[i].trim().toUpperCase();
        if (colStr.startsWith("FR(") && colStr.endsWith(")")) {
            const fr = colStr.slice(3, -1);
            const frNum = Number(fr);
            if (Number.isInteger(frNum)) {
                if (frNum != 0) {
                    arr.push(LV_GRID_FR(frNum));
                } else {
                    arr.push(0);
                }
            } else {
                arr.push(0);
            }
        } else if (colStr === "CONTENT") {
            arr.push(LV_GRID_CONTENT);
        } else {
            const col = Number(colStr);
            if (Number.isInteger(col)) {
                arr.push(col);
            } else {
                arr.push(0);
            }
        }
    }

    arr.push(LV_GRID_TEMPLATE_LAST);

    return arr;
}

function dscArrayValueBuild(value: string) {
    let arrStr = value.split(value.indexOf(",") !== -1 ? "," : " ");

    let resultArr: string[] = [];

    for (let i = 0; i < arrStr.length; i++) {
        const colStr = arrStr[i].trim().toUpperCase();
        if (colStr.startsWith("FR(") && colStr.endsWith(")")) {
            const fr = colStr.slice(3, -1);
            const frNum = Number(fr);
            if (Number.isInteger(frNum)) {
                if (frNum != 0) {
                    resultArr.push(`LV_GRID_FR(${frNum})`);
                } else {
                    resultArr.push("0");
                }
            } else {
                resultArr.push("0");
            }
        } else if (colStr === "CONTENT") {
            resultArr.push("LV_GRID_CONTENT");
        } else {
            const col = Number(colStr);
            if (Number.isInteger(col)) {
                resultArr.push(col.toString());
            } else {
                resultArr.push("0");
            }
        }
    }

    resultArr.push("LV_GRID_TEMPLATE_LAST");

    return resultArr.join(", ");
}

function dscArrayIsInt16(projectStore: ProjectStore) {
    return projectStore.project.settings.general.lvglVersion.startsWith("8.");
}

export const grid_row_dsc_array_property_info: LVGLPropertyInfo = {
    name: "grid_row_dsc_array",
    displayName: "网格行描述符",
    type: PropertyType.NumberArrayAsString,
    formText: "将网格行大小定义为以逗号或空格分隔的值列表。选项：固定像素值（例如 50）、FR(x)（例如 FR(1)、FR(2) 等）或 CONTENT。",
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_ROW_DSC_ARRAY,
        description:
            "用于描述网格行的数组。应以 LV_GRID_TEMPLATE_LAST 结尾。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false,
        valueRead: dscArrayValueRead,
        valueToNum: dscArrayValueToNum,
        valueBuild: dscArrayValueBuild,
        isInt16Array: dscArrayIsInt16
    }
};

export const grid_column_dsc_array_property_info: LVGLPropertyInfo = {
    name: "grid_column_dsc_array",
    displayName: "网格列描述符",
    type: PropertyType.NumberArrayAsString,
    formText: "将网格列大小定义为以逗号或空格分隔的值列表。选项：固定像素值（例如 50）、FR(x)（例如 FR(1)、FR(2) 等）或 CONTENT。",
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_COLUMN_DSC_ARRAY,
        description:
            "用于描述网格列的数组。应以 LV_GRID_TEMPLATE_LAST 结尾。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false,
        valueRead: dscArrayValueRead,
        valueToNum: dscArrayValueToNum,
        valueBuild: dscArrayValueBuild,
        isInt16Array: dscArrayIsInt16
    }
};

export const grid_cell_column_pos_property_info: LVGLPropertyInfo = {
    name: "grid_cell_column_pos",
    displayName: "网格单元列位置",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_CELL_COLUMN_POS,
        description: "设置对象应放置的列。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

export const grid_cell_column_span_property_info: LVGLPropertyInfo = {
    name: "grid_cell_column_span",
    displayName: "网格单元列跨度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_CELL_COLUMN_SPAN,
        description:
            "设置对象应跨越多少列。必须 >= 1。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const grid_cell_x_align_property_info: LVGLPropertyInfo = makeEnumPropertyInfo(
    "grid_cell_x_align",
    "网格单元 X 对齐",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_CELL_X_ALIGN,
        description: "设置如何水平对齐对象。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        START: LV_GRID_ALIGN_START,       // 起始
        CENTER: LV_GRID_ALIGN_CENTER,     // 居中
        END: LV_GRID_ALIGN_END,           // 结束
        STRETCH: LV_GRID_ALIGN_STRETCH,   // 拉伸
        SPACE_EVENLY: LV_GRID_ALIGN_SPACE_EVENLY, // 均匀分布
        SPACE_AROUND: LV_GRID_ALIGN_SPACE_AROUND, // 周围分布
        SPACE_BETWEEN: LV_GRID_ALIGN_SPACE_BETWEEN // 之间分布
    },
    "LV_GRID_ALIGN_"
);

export const grid_cell_row_pos_property_info: LVGLPropertyInfo = {
    name: "grid_cell_row_pos",
    displayName: "网格单元行位置",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_CELL_ROW_POS,
        description: "设置对象应放置的行。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

export const grid_cell_row_span_property_info: LVGLPropertyInfo = {
    name: "grid_cell_row_span",
    displayName: "网格单元行跨度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_CELL_ROW_SPAN,
        description:
            "设置对象应跨越多少行。必须 >= 1。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const grid_cell_y_align_property_info: LVGLPropertyInfo = makeEnumPropertyInfo(
    "grid_cell_y_align",
    "网格单元 Y 对齐",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_GRID_CELL_Y_ALIGN,
        description: "设置如何垂直对齐对象。",
        defaultValue: "1",
        inherited: false,
        layout: true,
        extDraw: false
    },
    {
        START: LV_GRID_ALIGN_START,       // 起始
        CENTER: LV_GRID_ALIGN_CENTER,     // 居中
        END: LV_GRID_ALIGN_END,           // 结束
        STRETCH: LV_GRID_ALIGN_STRETCH,   // 拉伸
        SPACE_EVENLY: LV_GRID_ALIGN_SPACE_EVENLY, // 均匀分布
        SPACE_AROUND: LV_GRID_ALIGN_SPACE_AROUND, // 周围分布
        SPACE_BETWEEN: LV_GRID_ALIGN_SPACE_BETWEEN // 之间分布
    },
    "LV_GRID_ALIGN_"
);

//
// 内边距
//

export const pad_top_property_info: LVGLPropertyInfo = {
    name: "pad_top",
    displayName: "顶部内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_PAD_TOP,
        description:
            "设置顶部内边距。它会在该方向缩小内容区域。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
export const pad_bottom_property_info: LVGLPropertyInfo = {
    name: "pad_bottom",
    displayName: "底部内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_PAD_BOTTOM,
        description:
            "设置底部内边距。它会在该方向缩小内容区域。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
export const pad_left_property_info: LVGLPropertyInfo = {
    name: "pad_left",
    displayName: "左侧内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_PAD_LEFT,
        description:
            "设置左侧内边距。它会在该方向缩小内容区域。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
export const pad_right_property_info: LVGLPropertyInfo = {
    name: "pad_right",
    displayName: "右侧内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_PAD_RIGHT,
        description:
            "设置右侧内边距。它会在该方向缩小内容区域。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
const pad_radial_property_info: LVGLPropertyInfo = {
    name: "pad_radial",
    displayName: "径向内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_PAD_RADIAL,
        description: "使文本标签远离刻度线的内边距。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const pad_row_property_info: LVGLPropertyInfo = {
    name: "pad_row",
    displayName: "行内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_PAD_ROW,
        description: "设置行之间的内边距。由布局使用。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
const pad_column_property_info: LVGLPropertyInfo = {
    name: "pad_column",
    displayName: "列内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_PAD_COLUMN,
        description:
            "设置列之间的内边距。由布局使用。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

//
// 外边距
//
const margin_top_property_info: LVGLPropertyInfo = {
    name: "margin_top",
    displayName: "顶部外边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MARGIN_TOP,
        description:
            "设置顶部外边距。在布局中，对象将与其兄弟对象保持该间距。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
const margin_bottom_property_info: LVGLPropertyInfo = {
    name: "margin_bottom",
    displayName: "底部外边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MARGIN_BOTTOM,
        description:
            "设置底部外边距。在布局中，对象将与其兄弟对象保持该间距。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
const margin_left_property_info: LVGLPropertyInfo = {
    name: "margin_left",
    displayName: "左侧外边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MARGIN_LEFT,
        description:
            "设置左侧外边距。在布局中，对象将与其兄弟对象保持该间距。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};
const margin_right_property_info: LVGLPropertyInfo = {
    name: "margin_right",
    displayName: "右侧外边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_MARGIN_RIGHT,
        description:
            "设置右侧外边距。在布局中，对象将与其兄弟对象保持该间距。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

//
// 背景
//

const bg_color_property_info: LVGLPropertyInfo = {
    name: "bg_color",
    displayName: "背景颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_COLOR,
        description: "设置对象的背景颜色。",
        defaultValue: "0xffffff",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
export const bg_opa_property_info: LVGLPropertyInfo = {
    name: "bg_opa",
    displayName: "背景不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_OPA,
        description:
            "设置背景的不透明度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_TRANSP",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_grad_color_property_info: LVGLPropertyInfo = {
    name: "bg_grad_color",
    displayName: "背景渐变颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_GRAD_COLOR,
        description:
            "设置背景的渐变颜色。仅当 grad_dir 不为 LV_GRAD_DIR_NONE 时使用。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_grad_dir_property_info = makeEnumPropertyInfo(
    "bg_grad_dir",
    "背景渐变方向",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_GRAD_DIR,
        description:
            "设置背景渐变的方向。可能的值有 LV_GRAD_DIR_NONE/HOR/VER。",
        defaultValue: "LV_GRAD_DIR_NONE",
        inherited: false,
        layout: false,
        extDraw: false
    },
    [
        "NONE", // 无渐变（`grad_color` 属性被忽略）
        "VER",  // 垂直（从上到下）渐变
        "HOR"   // 水平（从左到右）渐变
    ],
    "LV_GRAD_DIR_"
);
const bg_main_stop_property_info: LVGLPropertyInfo = {
    name: "bg_main_stop",
    displayName: "背景主渐变起点",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_MAIN_STOP,
        description:
            "设置背景颜色应从哪个点开始用于渐变。0 表示顶部/左侧，255 表示底部/右侧，128 表示中心，依此类推。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_grad_stop_property_info: LVGLPropertyInfo = {
    name: "bg_grad_stop",
    displayName: "背景渐变停止点",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_GRAD_STOP,
        description:
            "设置背景渐变颜色应从哪个点开始。0 表示顶部/左侧，255 表示底部/右侧，128 表示中心，依此类推。",
        defaultValue: "255",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_main_opa_property_info: LVGLPropertyInfo = {
    name: "bg_main_opa",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_MAIN_OPA,
        description: "",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_grad_opa_property_info: LVGLPropertyInfo = {
    name: "bg_grad_opa",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_GRAD_OPA,
        description: "",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_grad_property_info: LVGLPropertyInfo = {
    name: "bg_grad",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_GRAD,
        description:
            "设置渐变定义。所指向的实例在对象存续期间必须存在。NULL 表示禁用。它将 BG_GRAD_COLOR、BG_GRAD_DIR、BG_MAIN_STOP 和 BG_GRAD_STOP 合并为一个描述符，也允许创建更多颜色的渐变。",
        defaultValue: "NULL",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_dither_mode_property_info = makeEnumPropertyInfo(
    "bg_dither_mode",
    "背景抖动模式",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_DITHER_MODE,
        description:
            "设置背景渐变的抖动模式。可能的值有 LV_DITHER_NONE/ORDERED/ERR_DIFF。",
        defaultValue: "LV_DITHER_NONE",
        inherited: false,
        layout: false,
        extDraw: false
    },
    [
        "NONE",     // 无抖动，颜色仅量化到输出分辨率
        "ORDERED",  // 有序抖动。计算更快、占用内存更少，但质量较低
        "ERR_DIFF"  // 误差扩散模式。计算更慢、占用内存更多，但抖动质量最高
    ],
    "LV_DITHER_"
);
const bg_img_src_property_info: LVGLPropertyInfo = {
    name: "bg_img_src",
    displayName: "背景图像源",
    type: PropertyType.ObjectReference,
    referencedObjectCollectionPath: "bitmaps",
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_IMG_SRC,
        description:
            "设置背景图像。可以是指向 lv_img_dsc_t 的指针、文件路径或 LV_SYMBOL_...。",
        defaultValue: "NULL",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const bg_img_opa_property_info: LVGLPropertyInfo = {
    name: "bg_img_opa",
    displayName: "背景图像不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_IMG_OPA,
        description:
            "设置背景图像的不透明度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_img_recolor_property_info: LVGLPropertyInfo = {
    name: "bg_img_recolor",
    displayName: "背景图像重着色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_IMG_RECOLOR,
        description: "设置一种要与背景图像混合的颜色。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_img_recolor_opa_property_info: LVGLPropertyInfo = {
    name: "bg_img_recolor_opa",
    displayName: "背景图像重着色不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_IMG_RECOLOR_OPA,
        description:
            "设置背景图像重着色的强度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示不混合，255、LV_OPA_100 或 LV_OPA_COVER 表示完全重着色，其他值或 LV_OPA_10、LV_OPA_20 等按比例解释。",
        defaultValue: "LV_OPA_TRANSP",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const bg_img_tiled_property_info: LVGLPropertyInfo = {
    name: "bg_img_tiled",
    displayName: "背景图像平铺",
    type: PropertyType.Boolean,
    checkboxStyleSwitch: true,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BG_IMG_TILED,
        description:
            "如果启用，背景图像将平铺显示。可能的值是 true 或 false。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

//
// 边框
//

const border_color_property_info: LVGLPropertyInfo = {
    name: "border_color",
    displayName: "边框颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BORDER_COLOR,
        description: "设置边框的颜色。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const border_opa_property_info: LVGLPropertyInfo = {
    name: "border_opa",
    displayName: "边框不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BORDER_OPA,
        description:
            "设置边框的不透明度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
export const border_width_property_info: LVGLPropertyInfo = {
    name: "border_width",
    displayName: "边框宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BORDER_WIDTH,
        description:
            "设置边框的宽度。只能使用像素值。",
        defaultValue: "0",
        inherited: false,
        layout: true,
        extDraw: false
    }
};

const BorderSide = observer(
    class BorderSide extends React.Component<PropertyProps> {
        changeValue(newValue: any) {
            this.props.updateObject({
                [this.props.propertyInfo.name]: newValue
            });
        }

        render() {
            const { objects, propertyInfo, readOnly } = this.props;

            let enumItems: EnumItem[];

            if (propertyInfo.enumItems) {
                enumItems = getEnumItems(this.props.objects, propertyInfo);
            } else {
                enumItems = [];
            }

            const options = enumItems.map(enumItem => ({
                value: enumItem.id.toString(),
                label: (enumItem.label || enumItem.id).toString()
            }));

            let propertyValue = (objects[0] as any)[propertyInfo.name];
            for (let i = 1; i < objects.length; i++) {
                if ((objects[i] as any)[propertyInfo.name] != propertyValue) {
                    propertyValue = undefined;
                }
            }

            let selectedValues: any;
            let isMulti = false;

            if (propertyValue != undefined) {
                if (propertyValue == "NONE") {
                    selectedValues = [options[0]];
                } else if (propertyValue == "FULL") {
                    selectedValues = [options[5]];
                } else if (propertyValue == "INTERNAL") {
                    selectedValues = [options[6]];
                } else {
                    selectedValues = [];

                    propertyValue
                        .toString()
                        .split("|")
                        .forEach((part: string) => {
                            if (part == "BOTTOM") {
                                selectedValues.push(options[1]);
                            } else if (part == "TOP") {
                                selectedValues.push(options[2]);
                            } else if (part == "LEFT") {
                                selectedValues.push(options[3]);
                            } else if (part == "RIGHT") {
                                selectedValues.push(options[4]);
                            }
                        });

                    isMulti = true;
                }
            } else {
                selectedValues = [];
            }

            settingsController.isDarkTheme;

            return (
                <Select
                    options={options}
                    isMulti={isMulti}
                    onChange={selectedValues => {
                        if (!Array.isArray(selectedValues)) {
                            selectedValues = [selectedValues];
                        }

                        let propertyValue = "";

                        if (selectedValues.length == 0) {
                            propertyValue = "NONE";
                        } else if (
                            selectedValues[selectedValues.length - 1].value ==
                            "NONE"
                        ) {
                            propertyValue = "NONE";
                        } else if (
                            selectedValues[selectedValues.length - 1].value ==
                            "FULL"
                        ) {
                            propertyValue = "FULL";
                        } else if (
                            selectedValues[selectedValues.length - 1].value ==
                            "INTERNAL"
                        ) {
                            propertyValue = "INTERNAL";
                        } else {
                            for (let i = 0; i < selectedValues.length; i++) {
                                if (
                                    selectedValues[i].value == "BOTTOM" ||
                                    selectedValues[i].value == "TOP" ||
                                    selectedValues[i].value == "LEFT" ||
                                    selectedValues[i].value == "RIGHT"
                                ) {
                                    propertyValue =
                                        (propertyValue
                                            ? propertyValue + "|"
                                            : "") + selectedValues[i].value;
                                }
                            }
                        }

                        if (!propertyValue) {
                            propertyValue = "NONE";
                        }

                        this.changeValue(propertyValue);
                    }}
                    isDisabled={readOnly}
                    isClearable={false}
                    value={selectedValues}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    theme={theme => {
                        return {
                            ...theme,
                            colors: {
                                ...theme.colors,

                                danger: "#DE350B",
                                dangerLight: "#FFBDAD",

                                ...(settingsController.isDarkTheme
                                    ? {
                                          neutral0: "hsl(0, 0%, 10%)",
                                          neutral5: "hsl(0, 0%, 20%)",
                                          neutral10: "hsl(0, 0%, 30%)",
                                          neutral20: "hsl(0, 0%, 40%)",
                                          neutral30: "hsl(0, 0%, 50%)",
                                          neutral40: "hsl(0, 0%, 60%)",
                                          neutral50: "hsl(0, 0%, 70%)",
                                          neutral60: "hsl(0, 0%, 80%)",
                                          neutral70: "hsl(0, 0%, 90%)",
                                          neutral80: "hsl(0, 0%, 95%)",
                                          neutral90: "hsl(0, 0%, 100%)"
                                      }
                                    : {
                                          neutral0: "hsl(0, 0%, 100%)",
                                          neutral5: "hsl(0, 0%, 95%)",
                                          neutral10: "hsl(0, 0%, 90%)",
                                          neutral20: "hsl(0, 0%, 80%)",
                                          neutral30: "hsl(0, 0%, 70%)",
                                          neutral40: "hsl(0, 0%, 60%)",
                                          neutral50: "hsl(0, 0%, 50%)",
                                          neutral60: "hsl(0, 0%, 40%)",
                                          neutral70: "hsl(0, 0%, 30%)",
                                          neutral80: "hsl(0, 0%, 20%)",
                                          neutral90: "hsl(0, 0%, 10%)"
                                      }),

                                primary: "#2684FF",
                                primary25: "#DEEBFF",
                                primary50: "#B2D4FF",
                                primary75: "#4C9AFF"
                            }
                        };
                    }}
                    styles={{
                        option: (baseStyles, state) => ({
                            ...baseStyles,
                            ...(settingsController.isDarkTheme &&
                            state.isFocused
                                ? { color: "#333" }
                                : {})
                        })
                    }}
                />
            );
        }
    }
);

const border_side_property_info = makeEnumPropertyInfo(
    "border_side",
    "边框边",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BORDER_SIDE,
        description:
            "设置应仅在哪一侧绘制边框。可能的值有 LV_BORDER_SIDE_NONE/TOP/BOTTOM/LEFT/RIGHT/INTERNAL。也可以使用按位或组合的值，例如 LV_BORDER_SIDE_TOP | LV_BORDER_SIDE_LEFT。",
        defaultValue: "LV_BORDER_SIDE_NONE",
        inherited: false,
        layout: false,
        extDraw: false,

        valueRead: (value: number) => {
            if (value == 0x00) {
                return "NONE"; // 无
            }

            if (value == 0x0f) {
                return "FULL"; // 全部
            }

            if (value == 0x10) {
                return "INTERNAL"; // 内部
            }

            let propertyValue = "";

            if (value & 0x01) {
                propertyValue =
                    (propertyValue ? propertyValue + "|" : "") + "BOTTOM";
            }

            if (value & 0x02) {
                propertyValue =
                    (propertyValue ? propertyValue + "|" : "") + "TOP";
            }

            if (value & 0x04) {
                propertyValue =
                    (propertyValue ? propertyValue + "|" : "") + "LEFT";
            }

            if (value & 0x08) {
                propertyValue =
                    (propertyValue ? propertyValue + "|" : "") + "RIGHT";
            }

            return propertyValue;
        },
        valueToNum: (value: string) => {
            if (value == "NONE") {
                return 0;
            }

            if (value == "FULL") {
                return 0x0f;
            }

            if (value == "INTERNAL") {
                return 0x10;
            }

            let num = 0;

            if (value.indexOf("BOTTOM") != -1) {
                num |= 0x01;
            }

            if (value.indexOf("TOP") != -1) {
                num |= 0x02;
            }

            if (value.indexOf("LEFT") != -1) {
                num |= 0x04;
            }

            if (value.indexOf("RIGHT") != -1) {
                num |= 0x08;
            }

            return num;
        },
        valueBuild: (value: string) => {
            if (value == "NONE") {
                return "LV_BORDER_SIDE_NONE";
            }

            if (value == "FULL") {
                return "LV_BORDER_SIDE_FULL";
            }

            if (value == "INTERNAL") {
                return "LV_BORDER_SIDE_INTERNAL";
            }

            let build = "";

            if (value.indexOf("BOTTOM") != -1) {
                build = (build ? build + "|" : "") + "LV_BORDER_SIDE_BOTTOM";
            }

            if (value.indexOf("TOP") != -1) {
                build = (build ? build + "|" : "") + "LV_BORDER_SIDE_TOP";
            }

            if (value.indexOf("LEFT") != -1) {
                build = (build ? build + "|" : "") + "LV_BORDER_SIDE_LEFT";
            }

            if (value.indexOf("RIGHT") != -1) {
                build = (build ? build + "|" : "") + "LV_BORDER_SIDE_RIGHT";
            }

            return build;
        }
    },
    {
        NONE: 0x00,      // 无
        BOTTOM: 0x01,    // 底部
        TOP: 0x02,       // 顶部
        LEFT: 0x04,      // 左侧
        RIGHT: 0x08,     // 右侧
        FULL: 0x0f,      // 全部
        INTERNAL: 0x10   // 用于矩阵类对象（例如按钮矩阵）
    },
    "LV_BORDER_SIDE_",
    BorderSide
);

const border_post_property_info: LVGLPropertyInfo = {
    name: "border_post",
    displayName: "边框后置",
    type: PropertyType.Boolean,
    checkboxStyleSwitch: true,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BORDER_POST,
        description:
            "设置边框是在子对象绘制之前还是之后绘制。true：在子对象之后，false：在子对象之前。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

//
// 外轮廓
//

const outline_width_property_info: LVGLPropertyInfo = {
    name: "outline_width",
    displayName: "外轮廓宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_OUTLINE_WIDTH,
        description: "设置外轮廓的宽度（以像素为单位）。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const outline_color_property_info: LVGLPropertyInfo = {
    name: "outline_color",
    displayName: "外轮廓颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_OUTLINE_COLOR,
        description: "设置外轮廓的颜色。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const outline_opa_property_info: LVGLPropertyInfo = {
    name: "outline_opa",
    displayName: "外轮廓不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_OUTLINE_OPA,
        description:
            "设置外轮廓的不透明度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const outline_pad_property_info: LVGLPropertyInfo = {
    name: "outline_pad",
    displayName: "外轮廓内边距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_OUTLINE_PAD,
        description:
            "设置外轮廓的内边距，即对象与外轮廓之间的间隙。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};

//
// 阴影
//

const shadow_width_property_info: LVGLPropertyInfo = {
    name: "shadow_width",
    displayName: "阴影宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_SHADOW_WIDTH,
        description:
            "设置阴影的宽度（以像素为单位）。该值应 >= 0。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const shadow_ofs_x_property_info: LVGLPropertyInfo = {
    name: "shadow_ofs_x",
    displayName: "阴影 X 偏移",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_SHADOW_OFS_X,
        description: "在 X 方向上为阴影设置以像素为单位的偏移。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const shadow_ofs_y_property_info: LVGLPropertyInfo = {
    name: "shadow_ofs_y",
    displayName: "阴影 Y 偏移",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_SHADOW_OFS_Y,
        description: "在 Y 方向上为阴影设置以像素为单位的偏移。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const shadow_spread_property_info: LVGLPropertyInfo = {
    name: "shadow_spread",
    displayName: "阴影扩散",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_SHADOW_SPREAD,
        description:
            "让阴影计算使用更大或更小的矩形作为基准。该值可以用像素表示以增大/缩小区域。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const shadow_color_property_info: LVGLPropertyInfo = {
    name: "shadow_color",
    displayName: "阴影颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_SHADOW_COLOR,
        description: "设置阴影的颜色。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const shadow_opa_property_info: LVGLPropertyInfo = {
    name: "shadow_opa",
    displayName: "阴影不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_SHADOW_OPA,
        description:
            "设置阴影的不透明度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: true
    }
};

//
// 图像
//

const img_opa_property_info: LVGLPropertyInfo = {
    name: "img_opa",
    displayName: "图像不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_IMG_OPA,
        description:
            "设置图像的不透明度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const img_recolor_property_info: LVGLPropertyInfo = {
    name: "img_recolor",
    displayName: "图像重着色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_IMG_RECOLOR,
        description: "设置要与图像混合的颜色。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const img_recolor_opa_property_info: LVGLPropertyInfo = {
    name: "img_recolor_opa",
    displayName: "图像重着色不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_IMG_RECOLOR_OPA,
        description:
            "设置颜色混合的强度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

//
// 线条
//

const line_width_property_info: LVGLPropertyInfo = {
    name: "line_width",
    displayName: "线条宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LINE_WIDTH,
        description: "设置线条的宽度（以像素为单位）。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const line_dash_width_property_info: LVGLPropertyInfo = {
    name: "line_dash_width",
    displayName: "线条虚线宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LINE_DASH_WIDTH,
        description:
            "设置虚线段的宽度（以像素为单位）。请注意，虚线仅适用于水平和垂直线。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const line_dash_gap_property_info: LVGLPropertyInfo = {
    name: "line_dash_gap",
    displayName: "线条虚线间隙",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LINE_DASH_GAP,
        description:
            "设置虚线段之间的间隙（以像素为单位）。请注意，虚线仅适用于水平和垂直线。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const line_rounded_property_info: LVGLPropertyInfo = {
    name: "line_rounded",
    displayName: "线条圆角",
    type: PropertyType.Boolean,
    checkboxStyleSwitch: true,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LINE_ROUNDED,
        description:
            "使线条的端点变为圆角。true：圆角，false：垂直的线条端点。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const line_color_property_info: LVGLPropertyInfo = {
    name: "line_color",
    displayName: "线条颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LINE_COLOR,
        description: "设置线条的颜色。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const line_opa_property_info: LVGLPropertyInfo = {
    name: "line_opa",
    displayName: "线条不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_LINE_OPA,
        description: "设置线条的不透明度。",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

//
// 圆弧
//

const arc_width_property_info: LVGLPropertyInfo = {
    name: "arc_width",
    displayName: "圆弧宽度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ARC_WIDTH,
        description: "设置圆弧的宽度（粗细）（以像素为单位）。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: true
    }
};
const arc_rounded_property_info: LVGLPropertyInfo = {
    name: "arc_rounded",
    displayName: "圆弧圆角",
    type: PropertyType.Boolean,
    checkboxStyleSwitch: true,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ARC_ROUNDED,
        description:
            "使圆弧的端点变为圆角。true：圆角，false：垂直的端点。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const arc_color_property_info: LVGLPropertyInfo = {
    name: "arc_color",
    displayName: "圆弧颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ARC_COLOR,
        description: "设置圆弧的颜色。",
        defaultValue: "0x000000",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const arc_opa_property_info: LVGLPropertyInfo = {
    name: "arc_opa",
    displayName: "圆弧不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ARC_OPA,
        description: "设置圆弧的不透明度。",
        defaultValue: "LV_OPA_COVER",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const arc_img_src_property_info: LVGLPropertyInfo = {
    name: "arc_img_src",
    displayName: "圆弧图像源",
    type: PropertyType.ObjectReference,
    referencedObjectCollectionPath: "bitmaps",
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ARC_IMG_SRC,
        description:
            "设置一个用于将圆弧遮罩出来的图像。它对于在圆弧上显示复杂效果很有用。可以是指向 lv_img_dsc_t 的指针或文件路径。",
        defaultValue: "NULL",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

//
// 文本
//

const text_color_property_info: LVGLPropertyInfo = {
    name: "text_color",
    displayName: "文本颜色",
    type: PropertyType.ThemedColor,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TEXT_COLOR,
        description: "设置文本的颜色。",
        defaultValue: "0x000000",
        inherited: true,
        layout: false,
        extDraw: false
    }
};
const text_opa_property_info: LVGLPropertyInfo = {
    name: "text_opa",
    displayName: "文本不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TEXT_OPA,
        description:
            "设置文本的不透明度。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_COVER",
        inherited: true,
        layout: false,
        extDraw: false
    }
};
export const text_font_property_info: LVGLPropertyInfo = {
    name: "text_font",
    displayName: "文本字体",
    type: PropertyType.Enum,
    referencedObjectCollectionPath: "fonts",
    enumItems: (propertyValueHolder: PropertyValueHolder) => {
        let project = propertyValueHolder.projectStore?.project;
        if (!project) {
            project = ProjectEditor.getProject(propertyValueHolder);
        }
        return [
            ...project.fonts.map(font => ({
                id: font.name,
                label: font.name
            })),
            ...BUILT_IN_FONTS.map(id => ({ id, label: id }))
        ];
    },
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TEXT_FONT,
        description: "设置文本的字体（一个 lv_font_t * 指针）。",
        defaultValue: "LV_FONT_DEFAULT",
        inherited: true,
        layout: true,
        extDraw: false
    }
};
const text_letter_space_property_info: LVGLPropertyInfo = {
    name: "text_letter_space",
    displayName: "文本字符间距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TEXT_LETTER_SPACE,
        description: "设置以像素为单位的字符间距。",
        defaultValue: "0",
        inherited: true,
        layout: true,
        extDraw: false
    }
};
const text_line_space_property_info: LVGLPropertyInfo = {
    name: "text_line_space",
    displayName: "文本行间距",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TEXT_LINE_SPACE,
        description: "设置以像素为单位的行间距。",
        defaultValue: "0",
        inherited: true,
        layout: true,
        extDraw: false
    }
};

const TextDecorationSide = observer(
    class TextDecorationSide extends React.Component<PropertyProps> {
        changeValue(newValue: any) {
            this.props.updateObject({
                [this.props.propertyInfo.name]: newValue
            });
        }

        render() {
            const { objects, propertyInfo, readOnly } = this.props;

            let enumItems: EnumItem[];

            if (propertyInfo.enumItems) {
                enumItems = getEnumItems(this.props.objects, propertyInfo);
            } else {
                enumItems = [];
            }

            const options = enumItems.map(enumItem => ({
                value: enumItem.id.toString(),
                label: (enumItem.label || enumItem.id).toString()
            }));

            let propertyValue = (objects[0] as any)[propertyInfo.name];
            for (let i = 1; i < objects.length; i++) {
                if ((objects[i] as any)[propertyInfo.name] != propertyValue) {
                    propertyValue = undefined;
                }
            }

            let selectedValues: any;
            let isMulti = false;

            if (propertyValue != undefined) {
                if (propertyValue == "NONE") {
                    selectedValues = [options[0]];
                } else {
                    selectedValues = [];

                    propertyValue
                        .toString()
                        .split("|")
                        .forEach((part: string) => {
                            if (part == "UNDERLINE") {
                                selectedValues.push(options[1]);
                            } else if (part == "STRIKETHROUGH") {
                                selectedValues.push(options[2]);
                            }
                        });

                    isMulti = true;
                }
            } else {
                selectedValues = [];
            }

            settingsController.isDarkTheme;

            return (
                <Select
                    options={options}
                    isMulti={isMulti}
                    onChange={selectedValues => {
                        if (!Array.isArray(selectedValues)) {
                            selectedValues = [selectedValues];
                        }

                        let propertyValue = "";

                        if (selectedValues.length == 0) {
                            propertyValue = "NONE";
                        } else if (
                            selectedValues[selectedValues.length - 1].value ==
                            "NONE"
                        ) {
                            propertyValue = "NONE";
                        } else {
                            for (let i = 0; i < selectedValues.length; i++) {
                                if (
                                    selectedValues[i].value == "UNDERLINE" ||
                                    selectedValues[i].value == "STRIKETHROUGH"
                                ) {
                                    propertyValue =
                                        (propertyValue
                                            ? propertyValue + "|"
                                            : "") + selectedValues[i].value;
                                }
                            }
                        }

                        if (!propertyValue) {
                            propertyValue = "NONE";
                        }

                        this.changeValue(propertyValue);
                    }}
                    isDisabled={readOnly}
                    isClearable={false}
                    value={selectedValues}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    theme={theme => {
                        return {
                            ...theme,
                            colors: {
                                ...theme.colors,

                                danger: "#DE350B",
                                dangerLight: "#FFBDAD",

                                ...(settingsController.isDarkTheme
                                    ? {
                                          neutral0: "hsl(0, 0%, 10%)",
                                          neutral5: "hsl(0, 0%, 20%)",
                                          neutral10: "hsl(0, 0%, 30%)",
                                          neutral20: "hsl(0, 0%, 40%)",
                                          neutral30: "hsl(0, 0%, 50%)",
                                          neutral40: "hsl(0, 0%, 60%)",
                                          neutral50: "hsl(0, 0%, 70%)",
                                          neutral60: "hsl(0, 0%, 80%)",
                                          neutral70: "hsl(0, 0%, 90%)",
                                          neutral80: "hsl(0, 0%, 95%)",
                                          neutral90: "hsl(0, 0%, 100%)"
                                      }
                                    : {
                                          neutral0: "hsl(0, 0%, 100%)",
                                          neutral5: "hsl(0, 0%, 95%)",
                                          neutral10: "hsl(0, 0%, 90%)",
                                          neutral20: "hsl(0, 0%, 80%)",
                                          neutral30: "hsl(0, 0%, 70%)",
                                          neutral40: "hsl(0, 0%, 60%)",
                                          neutral50: "hsl(0, 0%, 50%)",
                                          neutral60: "hsl(0, 0%, 40%)",
                                          neutral70: "hsl(0, 0%, 30%)",
                                          neutral80: "hsl(0, 0%, 20%)",
                                          neutral90: "hsl(0, 0%, 10%)"
                                      }),

                                primary: "#2684FF",
                                primary25: "#DEEBFF",
                                primary50: "#B2D4FF",
                                primary75: "#4C9AFF"
                            }
                        };
                    }}
                    styles={{
                        option: (baseStyles, state) => ({
                            ...baseStyles,
                            ...(settingsController.isDarkTheme &&
                            state.isFocused
                                ? { color: "#333" }
                                : {})
                        })
                    }}
                />
            );
        }
    }
);

const text_decor_property_info = makeEnumPropertyInfo(
    "text_decor",
    "文本装饰",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TEXT_DECOR,
        description:
            "为文本设置装饰。可能的值有 LV_TEXT_DECOR_NONE/UNDERLINE/STRIKETHROUGH。也可以使用按位或组合的值。",
        defaultValue: "LV_TEXT_DECOR_NONE",
        inherited: true,
        layout: false,
        extDraw: false,

        valueRead: (value: number) => {
            if (value == 0x00) {
                return "NONE"; // 无
            }

            let propertyValue = "";

            if (value & 0x01) {
                propertyValue =
                    (propertyValue ? propertyValue + "|" : "") + "UNDERLINE";
            }

            if (value & 0x02) {
                propertyValue =
                    (propertyValue ? propertyValue + "|" : "") +
                    "STRIKETHROUGH";
            }

            return propertyValue;
        },
        valueToNum: (value: string) => {
            if (value == "NONE") {
                return 0;
            }

            let num = 0;

            if (value.indexOf("UNDERLINE") != -1) {
                num |= 0x01;
            }

            if (value.indexOf("STRIKETHROUGH") != -1) {
                num |= 0x02;
            }

            return num;
        },
        valueBuild: (value: string) => {
            if (value == "NONE") {
                return "LV_TEXT_DECOR_NONE";
            }

            let build = "";

            if (value.indexOf("UNDERLINE") != -1) {
                build = (build ? build + "|" : "") + "LV_TEXT_DECOR_UNDERLINE";
            }

            if (value.indexOf("STRIKETHROUGH") != -1) {
                build =
                    (build ? build + "|" : "") + "LV_TEXT_DECOR_STRIKETHROUGH";
            }

            return build;
        }
    },
    ["NONE", "UNDERLINE", "STRIKETHROUGH"], // 无、下划线、删除线
    "LV_TEXT_DECOR_",
    TextDecorationSide
);

const text_align_property_info = makeEnumPropertyInfo(
    "text_align",
    "文本对齐",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TEXT_ALIGN,
        description:
            "设置如何对齐文本的各行。请注意，它不改变对象本身的对齐方式，仅改变对象内部各行的对齐方式。可能的值有 LV_TEXT_ALIGN_LEFT/CENTER/RIGHT/AUTO。LV_TEXT_ALIGN_AUTO 检测文本的基础方向并相应地使用左对齐或右对齐。",
        defaultValue: "LV_TEXT_ALIGN_AUTO",
        inherited: true,
        layout: true,
        extDraw: false
    },
    ["AUTO", "LEFT", "CENTER", "RIGHT"], // 自动、左、居中、右
    "LV_TEXT_ALIGN_"
);

//
// 其他
//

export const radius_property_info: LVGLPropertyInfo = {
    name: "radius",
    displayName: "圆角半径",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_RADIUS,
        description:
            "设置每个角的圆角半径。该值以像素（>= 0）或 LV_RADIUS_CIRCLE（表示最大半径）进行解释。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

const radial_offset_property_info: LVGLPropertyInfo = {
    name: "radial_offset",
    displayName: "径向偏移",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_RADIAL_OFFSET,
        description:
            "沿径向移动对象的起点（例如刻度线的起点）。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};

const clip_corner_property_info: LVGLPropertyInfo = {
    name: "clip_corner",
    displayName: "裁剪圆角",
    type: PropertyType.Boolean,
    checkboxStyleSwitch: true,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_CLIP_CORNER,
        description:
            "启用后在圆角处裁剪溢出的内容。可以是 true 或 false。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
export const opa_property_info: LVGLPropertyInfo = {
    name: "opa",
    displayName: "不透明度",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_OPA,
        description:
            "按此因子降低对象所有不透明度值。值 0、LV_OPA_0 或 LV_OPA_TRANSP 表示完全透明，255、LV_OPA_100 或 LV_OPA_COVER 表示完全覆盖，其他值或 LV_OPA_10、LV_OPA_20 等表示半透明。",
        defaultValue: "LV_OPA_COVER",
        inherited: true,
        layout: false,
        extDraw: false
    }
};
const color_filter_dsc_property_info: LVGLPropertyInfo = {
    name: "color_filter_dsc",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_COLOR_FILTER_DSC,
        description: "将一种颜色混合到对象的所有颜色中。",
        defaultValue: "NULL",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const color_filter_opa_property_info: LVGLPropertyInfo = {
    name: "color_filter_opa",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_COLOR_FILTER_OPA,
        description: "颜色过滤器混合的强度。",
        defaultValue: "LV_OPA_TRANSP",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const anim_property_info: LVGLPropertyInfo = {
    name: "anim",
    type: PropertyType.String,
    formText: "例如，delay=1000, repeat_delay=1000, repeat_count=3（任意顺序，全部可选，repeat_count=-1 表示无限循环）",
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ANIM,
        description:
            "对象动画的动画模板。应是指向 lv_anim_t 的指针。动画参数与部件相关，例如动画时间可以是文本区域光标闪烁时间或滚轮的滚动时间。请参阅部件文档以了解更多信息。",
        defaultValue: "NULL",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const anim_time_property_info: LVGLPropertyInfo = {
    name: "anim_time",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ANIM_TIME,
        description:
            "以毫秒为单位的动画时间。其含义与部件相关。例如文本区域光标闪烁时间或滚轮的滚动时间。请参阅部件文档以了解更多信息。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const anim_duration_property_info: LVGLPropertyInfo = {
    name: "anim_duration",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ANIM_DURATION,
        description: "",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const anim_speed_property_info: LVGLPropertyInfo = {
    name: "anim_speed",
    type: PropertyType.Number,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_ANIM_SPEED,
        description:
            "以像素/秒为单位的动画速度。其含义与部件相关。例如标签的滚动速度。请参阅部件文档以了解更多信息。",
        defaultValue: "0",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const transition_property_info: LVGLPropertyInfo = {
    name: "transition",
    type: PropertyType.Any,
    lvglStyleProp: {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_TRANSITION,
        description:
            "用于描述过渡的已初始化的 lv_style_transition_dsc_t。",
        defaultValue: "NULL",
        inherited: false,
        layout: false,
        extDraw: false
    }
};
const blend_mode_property_info = makeEnumPropertyInfo(
    "blend_mode",
    "混合模式",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BLEND_MODE,
        description:
            "描述如何将颜色混合到背景上。可能的值有 LV_BLEND_MODE_NORMAL/ADDITIVE/SUBTRACTIVE/MULTIPLY。",
        defaultValue: "LV_BLEND_MODE_NORMAL",
        inherited: false,
        layout: false,
        extDraw: false
    },
    [
        "NORMAL",      // 仅根据不透明度值进行简单混合
        "ADDITIVE",    // 相加相应的颜色通道
        "SUBTRACTIVE", // 从背景中减去前景
        "MULTIPLY",    // 相乘前景和背景
        "REPLACE"      // 在该区域用前景替换背景
    ],
    "LV_BLEND_MODE_"
);
const base_dir_property_info = makeEnumPropertyInfo(
    "base_dir",
    "基础方向",
    {
        code: LVGL_STYLE_PROP_CODES.LV_STYLE_BASE_DIR,
        description:
            "设置对象的基础方向。可能的值有 LV_BIDI_DIR_LTR/RTL/AUTO。",
        defaultValue: "LV_BASE_DIR_AUTO",
        inherited: true,
        layout: true,
        extDraw: false
    },
    ["LTR", "RTL", "AUTO"], // 从左到右、从右到左、自动
    "LV_BASE_DIR_"
);

////////////////////////////////////////////////////////////////////////////////

export interface LVGLPropertiesGroup {
    groupName: string;
    groupDescription: string;
    properties: LVGLPropertyInfo[];
}

export const lvglProperties: LVGLPropertiesGroup[] = [
    {
        groupName: "位置和大小",
        groupDescription:
            "与对象的大小、位置、对齐和布局相关的属性。",
        properties: [
            align_property_info,
            width_property_info,
            height_property_info,

            length_property_info,

            min_width_property_info,
            max_width_property_info,
            min_height_property_info,
            max_height_property_info,

            x_property_info,
            y_property_info,

            transform_width_property_info,
            transform_height_property_info,
            translate_x_property_info,
            translate_y_property_info,

            transform_zoom_property_info,
            transform_scale_x_property_info,
            transform_scale_y_property_info,

            transform_angle_property_info,
            transform_rotation_property_info,

            transform_pivot_x_property_info,
            transform_pivot_y_property_info,

            transform_skew_x_property_info,
            transform_skew_y_property_info
        ]
    },

    {
        groupName: "布局",
        groupDescription: "描述布局的属性。",
        properties: [
            layout_property_info,

            flex_flow_property_info,
            flex_main_place_property_info,
            flex_cross_place_property_info,
            flex_track_place_property_info,
            flex_grow_property_info,

            grid_column_align_property_info,
            grid_row_align_property_info,
            grid_row_dsc_array_property_info,
            grid_column_dsc_array_property_info,
            grid_cell_column_pos_property_info,
            grid_cell_column_span_property_info,
            grid_cell_x_align_property_info,
            grid_cell_row_pos_property_info,
            grid_cell_row_span_property_info,
            grid_cell_y_align_property_info
        ]
    },

    {
        groupName: "内边距",
        groupDescription:
            "描述父对象各边与子对象之间以及子对象相互之间的间距的属性。与 HTML 中的 padding 属性非常相似。",
        properties: [
            pad_top_property_info,
            pad_bottom_property_info,
            pad_left_property_info,
            pad_right_property_info,
            pad_radial_property_info,
            pad_row_property_info,
            pad_column_property_info
        ]
    },

    {
        groupName: "外边距",
        groupDescription:
            "描述对象周围间距的属性。与 HTML 中的 margin 属性非常相似。",
        properties: [
            margin_top_property_info,
            margin_bottom_property_info,
            margin_left_property_info,
            margin_right_property_info
        ]
    },

    {
        groupName: "背景",
        groupDescription:
            "描述对象背景颜色和图像的属性。",
        properties: [
            bg_color_property_info,
            bg_opa_property_info,

            bg_grad_dir_property_info,
            bg_grad_color_property_info,
            bg_grad_stop_property_info,
            bg_main_stop_property_info,

            bg_main_opa_property_info,
            bg_grad_opa_property_info,
            //bg_grad_property_info,
            bg_dither_mode_property_info,

            bg_img_src_property_info,
            bg_img_opa_property_info,
            bg_img_recolor_property_info,
            bg_img_recolor_opa_property_info,

            bg_img_tiled_property_info
        ]
    },

    {
        groupName: "边框",
        groupDescription: "描述边框的属性。",
        properties: [
            border_color_property_info,
            border_opa_property_info,
            border_width_property_info,
            border_side_property_info,
            border_post_property_info
        ]
    },

    {
        groupName: "外轮廓",
        groupDescription:
            "描述外轮廓的属性。它类似于边框，但绘制在矩形之外。",
        properties: [
            outline_width_property_info,
            outline_color_property_info,
            outline_opa_property_info,
            outline_pad_property_info
        ]
    },

    {
        groupName: "阴影",
        groupDescription:
            "描述绘制在矩形下方阴影的属性。",
        properties: [
            shadow_width_property_info,
            shadow_ofs_x_property_info,
            shadow_ofs_y_property_info,
            shadow_spread_property_info,
            shadow_color_property_info,
            shadow_opa_property_info
        ]
    },

    {
        groupName: "图像",
        groupDescription: "描述图像的属性。",
        properties: [
            img_opa_property_info,
            img_recolor_property_info,
            img_recolor_opa_property_info
        ]
    },

    {
        groupName: "线条",
        groupDescription: "描述类线条对象的属性。",
        properties: [
            line_width_property_info,
            line_dash_width_property_info,
            line_dash_gap_property_info,
            line_rounded_property_info,
            line_color_property_info,
            line_opa_property_info
        ]
    },

    {
        groupName: "圆弧",
        groupDescription: "待办",
        properties: [
            arc_width_property_info,
            arc_rounded_property_info,
            arc_color_property_info,
            arc_opa_property_info,
            arc_img_src_property_info
        ]
    },

    {
        groupName: "文本",
        groupDescription:
            "描述文本属性的属性。所有这些属性都会被继承。",
        properties: [
            text_color_property_info,
            text_opa_property_info,
            text_font_property_info,
            text_letter_space_property_info,
            text_line_space_property_info,
            text_decor_property_info,
            text_align_property_info
        ]
    },

    {
        groupName: "其他",
        groupDescription: "用于各种用途的混合属性。",
        properties: [
            radius_property_info,
            radial_offset_property_info,
            clip_corner_property_info,
            opa_property_info,
            //color_filter_dsc_property_info,
            //color_filter_opa_property_info,
            //transition_property_info,
            blend_mode_property_info,
            base_dir_property_info,

            anim_property_info,
            anim_time_property_info,
            anim_duration_property_info,
            anim_speed_property_info
        ]
    }
];

export const unusedProperties = [
    width_property_info,
    height_property_info,
    x_property_info,
    y_property_info,

    bg_grad_property_info,

    color_filter_dsc_property_info,
    color_filter_opa_property_info,
    anim_property_info,
    transition_property_info
];

export const lvglPropertiesMap = new Map<string, LVGLPropertyInfo>();
lvglProperties.forEach(propertyGroup =>
    propertyGroup.properties.forEach(property => {
        if (lvglPropertiesMap.get(property.name)) {
            console.error("意外！", property.name);
        }
        lvglPropertiesMap.set(property.name, property);
    })
);

export function isLvglStylePropertySupported(
    object: IEezObject,
    propertyInfo: LVGLPropertyInfo
) {
    const lvglVersion =
        ProjectEditor.getProject(object).settings.general.lvglVersion;

    return propertyInfo.lvglStyleProp.code[lvglVersion] != undefined;
}
