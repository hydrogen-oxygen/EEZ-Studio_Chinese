import { parseIdentifier } from "project-editor/flow/expression";

const VALIDATION_MESSAGE_INVALID_IDENTIFIER =
    "无效的标识符。标识符以字母或下划线 (_) 开头，后跟零个或多个字母、数字或下划线。不允许出现空格。";

export const validators = {
    identifierValidator: (object: any, ruleName: string) => {
        const value = object[ruleName];
        if (!parseIdentifier(value) || value.startsWith("$")) {
            return VALIDATION_MESSAGE_INVALID_IDENTIFIER;
        }
        return null;
    }
};
