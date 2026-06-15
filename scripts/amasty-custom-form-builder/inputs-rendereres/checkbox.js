/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { Checkbox, provider as UI } from '@dropins/tools/components.js';
import {
    normalizeOptions,
    normalizeControlValue,
    getFieldName,
    getFieldLabel,
} from '../helpers/domHelpers.js';

export default function renderCheckbox(input, mountNode, fieldState) {
    const settings = input?.settings ?? {};
    const options = normalizeOptions(settings.options);
    const defaultValue = settings.defaultValue;
    const initialDefaultValues = Array.isArray(defaultValue)
        ? defaultValue.map((value) => normalizeControlValue(value).trim()).filter(Boolean)
        : normalizeControlValue(defaultValue)
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
    let selectedValues = new Set(initialDefaultValues);

    fieldState.getValue = () => Array.from(selectedValues);
    fieldState.onErrorChange = () => {
        render();
    };

    const render = () => {
        const groupNode = document.createElement('div');
        const fieldName = getFieldName(input);

        mountNode.textContent = '';

        if (!options.length) {
            const optionNode = document.createElement('div');
            UI.render(Checkbox, {
                name: fieldName,
                value: 'true',
                label: getFieldLabel(input),
                checked: selectedValues.has('true'),
                required: false,
                error: fieldState.hasError,
                onChange: (event) => {
                    const isChecked = Boolean(event?.currentTarget?.checked);
                    selectedValues = new Set(isChecked ? ['true'] : []);
                    render();
                },
            })(optionNode);
            groupNode.append(optionNode);
            mountNode.append(groupNode);

            return;
        }

        options.forEach((option) => {
            const optionNode = document.createElement('div');

            UI.render(Checkbox, {
                name: `${fieldName}_${option.id}`,
                value: option.value,
                label: option.label,
                checked: selectedValues.has(normalizeControlValue(option.value)),
                required: false,
                error: fieldState.hasError,
                onChange: (event) => {
                    const isChecked = Boolean(event?.currentTarget?.checked);
                    const nextValues = new Set(selectedValues);
                    const normalizedOptionValue = normalizeControlValue(option.value);

                    if (isChecked) {
                        nextValues.add(normalizedOptionValue);
                    } else {
                        nextValues.delete(normalizedOptionValue);
                    }

                    selectedValues = nextValues;
                    render();
                },
            })(optionNode);
            groupNode.append(optionNode);
        });

        mountNode.append(groupNode);
    };

    render();
}
