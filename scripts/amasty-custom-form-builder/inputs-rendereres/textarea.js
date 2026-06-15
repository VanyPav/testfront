/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { TextArea, provider as UI } from '@dropins/tools/components.js';
import {
    normalizeControlValue,
    getFieldName,
    getFieldLabel,
    getMaxLength,
    isFieldRequired,
} from '../helpers/domHelpers.js';

export default function renderTextarea(input, mountNode, fieldState) {
    const settings = input?.settings ?? {};
    let value = normalizeControlValue(settings.defaultValue);

    fieldState.getValue = () => value;
    fieldState.showExternalError = false;

    const render = () => {
        mountNode.textContent = '';
        UI.render(TextArea, {
            name: getFieldName(input),
            value,
            label: getFieldLabel(input),
            placeholder: settings.placeholder || undefined,
            maxLength: getMaxLength(settings),
            required: isFieldRequired(input),
            error: fieldState.hasError,
            errorMessage: fieldState.errorMessage || undefined,
            onChange: (event) => {
                value = event?.target?.value ?? '';
            },
        })(mountNode);
    };

    fieldState.onErrorChange = () => {
        render();
    };

    render();
}
