import React from "react";
import { observer } from "mobx-react"; // MobX 观察者，用于响应式更新
import classNames from "classnames";    // 用于拼接 CSS 类名的工具库

import { Icon } from "eez-studio-ui/icon";     // 图标组件
import { Loader } from "eez-studio-ui/loader"; // 加载指示器组件

// ============================================================
// 基础操作组件（Action）：渲染为一个 <button> 按钮
// ============================================================
const Action = observer(
    class Action extends React.Component<
        {
            children?: React.ReactNode;
            title: string;
            onClick?: (event: any) => void;
            selected?: boolean;
            className?: string;
            style?: React.CSSProperties;
            enabled?: boolean;
        },
        {}
    > {
        // 点击事件处理：先让按钮失焦，再执行外部传入的回调
        onClick = (event: any) => {
            event.target.blur(); // 防止按钮点击后保持聚焦
            if (this.props.onClick) {
                event.stopPropagation();
                event.preventDefault();
                this.props.onClick(event);
            }
        };

        render() {
            // 拼接基础类名，选中时附加 "selected" 类
            let className = classNames(
                "EezStudio_Action",
                this.props.className,
                {
                    selected: this.props.selected === true
                }
            );

            const { title } = this.props;

            // 组装按钮属性
            let buttonProps = {
                className,
                title,
                onClick: this.onClick,
                disabled: this.props.enabled === false, // enabled 为 false 时禁用
                style: this.props.style
            };

            return <button {...buttonProps}>{this.props.children}</button>;
        }
    }
);

// ============================================================
// 文本操作组件（TextAction）：带可选图标的文字按钮
// ============================================================
export const TextAction = observer(
    class TextAction extends React.Component<
        {
            text: string;                       // 按钮文字
            icon?: string;                      // 图标名称（可选）
            iconSize?: number;                  // 图标大小
            title: string;                      // 悬停提示
            onClick: () => void;                // 点击回调
            selected?: boolean;                 // 是否选中
            enabled?: boolean;                  // 是否可用
            style?: React.CSSProperties;        // 内联样式
        },
        {}
    > {
        render() {
            return (
                // 复用基础 Action，附加 TextAction 类名
                <Action className="EezStudio_TextAction" {...this.props}>
                    {/* 如果有图标则渲染图标 */}
                    {this.props.icon && (
                        <Icon
                            icon={this.props.icon}
                            size={this.props.iconSize}
                        />
                    )}{" "}
                    {this.props.text} {/* 按钮文字 */}
                </Action>
            );
        }
    }
);

// ============================================================
// 图标操作组件（IconAction）：纯图标按钮
// ============================================================
export const IconAction = observer(
    class IconAction extends React.Component<
        {
            icon: string | React.ReactNode;     // 图标（名称或节点）
            iconSize?: number;                  // 图标大小
            title: string;                      // 悬停提示
            onClick?: (event: any) => void;     // 点击回调
            selected?: boolean;                 // 是否选中
            enabled?: boolean;                  // 是否可用
            className?: string;                 // 附加类名
            style?: React.CSSProperties;        // 内联样式
            color?: string;                     // 图标颜色
            overlayText?: string;               // 覆盖在图标上的文字
            attention?: boolean;                // 是否需要醒目显示
        },
        {}
    > {
        render() {
            let className = classNames(
                "EezStudio_IconAction",
                this.props.className
            );

            let style;
            // 如果指定了颜色，则应用到图标样式上
            if (this.props.color) {
                style = { color: this.props.color };
            }

            return (
                <Action {...this.props} className={className}>
                    <Icon
                        icon={this.props.icon}
                        size={this.props.iconSize}
                        style={style}
                        overlayText={this.props.overlayText}
                        attention={this.props.attention}
                    />
                </Action>
            );
        }
    }
);

// ============================================================
// 按钮操作组件（ButtonAction）：带图标和文字的标准按钮（使用 Bootstrap 的 btn 样式）
// ============================================================
export const ButtonAction = observer(
    class ButtonAction extends React.Component<{
        text: React.ReactNode;                 // 按钮文字（可为任意节点）
        icon?: string | JSX.Element;           // 图标（名称或元素）
        iconSize?: number;                     // 图标大小
        iconStyle?: React.CSSProperties;       // 图标样式
        title: string;                         // 悬停提示
        onClick?: (event: any) => void;        // 点击回调
        selected?: boolean;                    // 是否选中
        enabled?: boolean;                     // 是否可用
        className?: string;                    // 附加类名
        style?: React.CSSProperties;           // 内联样式
        attention?: boolean;                   // 是否醒目
        loader?: boolean;                      // 是否显示加载指示器
    }> {
        render() {
            const { style, icon, iconSize, text } = this.props;
            let className = classNames(
                "EezStudio_ButtonAction btn", // 使用 Bootstrap 的按钮样式
                this.props.className
            );

            return (
                <Action {...this.props} className={className} style={style}>
                    {/* 图标：默认带右边距 5px */}
                    {icon && (
                        <Icon
                            icon={icon}
                            size={iconSize}
                            style={Object.assign(this.props.iconStyle || {}, {
                                marginRight: 5
                            })}
                            attention={this.props.attention}
                        />
                    )}
                    {text} {/* 按钮文字 */}
                    {/* 可选：在文字右侧显示加载指示器 */}
                    {this.props.loader && (
                        <Loader size={20} style={{ marginLeft: 5 }} />
                    )}
                </Action>
            );
        }
    }
);

// ============================================================
// 下拉按钮组件（DropdownButtonAction）：点击弹出菜单的文字按钮
// ============================================================
export const DropdownButtonAction = observer(
    class DropdownButtonAction extends React.Component<
        {
            children?: React.ReactNode;        // 下拉菜单内容
            text: string;                      // 按钮文字
            icon?: string;                     // 图标名称
            iconSize?: number;                 // 图标大小
            title: string;                     // 悬停提示
            onClick?: (event: any) => void;    // 点击回调
            enabled?: boolean;                 // 是否可用
            className?: string;                // 附加类名
            style?: React.CSSProperties;       // 内联样式
        },
        {}
    > {
        render() {
            const { style, icon, iconSize, text, title, onClick, enabled } =
                this.props;
            let className = classNames(
                "EezStudio_ButtonAction btn dropdown-toggle", // Bootstrap 下拉按钮
                this.props.className
            );

            let buttonProps = {
                className,
                title,
                onClick: onClick,
                disabled: enabled === false,
                style: style
            };

            return (
                <div className="dropdown">
                    {/* 使用 Bootstrap 5 的数据属性控制下拉行为 */}
                    <button
                        {...buttonProps}
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                    >
                        {icon && (
                            <Icon
                                icon={icon}
                                size={iconSize}
                                style={{ marginRight: 10 }}
                            />
                        )}
                        {text}
                    </button>
                    {/* 下拉菜单容器，内容由 children 传入 */}
                    <div className="dropdown-menu">{this.props.children}</div>
                </div>
            );
        }
    }
);

// ============================================================
// 下拉图标组件（DropdownIconAction）：点击弹出菜单的纯图标按钮
// ============================================================
export const DropdownIconAction = observer(
    class DropdownIconAction extends React.Component<
        {
            children?: React.ReactNode;        // 下拉菜单内容
            icon: string;                      // 图标名称
            iconSize?: number;                 // 图标大小
            title: string;                     // 悬停提示
            onClick?: (event: any) => void;    // 点击回调
            enabled?: boolean;                 // 是否可用
            className?: string;                // 附加类名
            style?: React.CSSProperties;       // 内联样式
        },
        {}
    > {
        render() {
            const { style, icon, iconSize, title, onClick, enabled } =
                this.props;
            let className = classNames(
                "EezStudio_IconAction",
                this.props.className
            );

            let buttonProps = {
                className,
                title,
                onClick: onClick,
                disabled: enabled === false,
                style: style
            };

            return (
                <div className="dropdown">
                    {/* type="button" 避免触发表单提交；自动关闭下拉 */}
                    <button
                        {...buttonProps}
                        type="button"
                        data-bs-auto-close="true"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <Icon icon={icon} size={iconSize} />
                    </button>
                    <div className="dropdown-menu">{this.props.children}</div>
                </div>
            );
        }
    }
);

// ============================================================
// 下拉菜单项组件（DropdownItem）：用于 dropdown-menu 中的单个选项
// ============================================================
export const DropdownItem = observer(
    class DropdownItem extends React.Component<
        {
            text: string;               // 显示的文字
            title?: string;             // 悬停提示（可选）
            onClick: () => void;        // 点击回调
            disabled?: boolean;         // 是否禁用
        },
        {}
    > {
        render() {
            const { text } = this.props;

            // 禁用时附加 "disabled" 类
            let className = classNames("dropdown-item", {
                disabled: this.props.disabled
            });

            return (
                <a
                    className={className}
                    title={this.props.title}
                    href="#"
                    onClick={this.props.onClick}
                >
                    {text}
                </a>
            );
        }
    }
);
