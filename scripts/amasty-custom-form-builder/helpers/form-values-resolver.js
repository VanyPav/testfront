/**
 * @author Amasty Team
 * @copyright Copyright (c) Amasty (https://www.amasty.com)
 * @package Custom Form Builder
 */

import { getFieldName, normalizeControlValue } from './domHelpers.js';

const OPTION_VALUE_KEYS = ['value', 'label', 'name', 'text', 'title', 'id'];
const OPTION_LOOKUP_KEYS = ['id', 'option_id', 'value', 'label', 'name', 'text', 'title'];

function pickFirstNormalizedValue(source, keys) {
    for (const key of keys) {
        const normalizedValue = normalizeControlValue(source?.[key]);
        if (normalizedValue) {
            return normalizedValue;
        }
    }

    return '';
}

function getInputIdByFieldName(fieldName) {
    const normalizedFieldName = String(fieldName).replace('am_custom_field_', '');
    const parsedInputId = Number.parseInt(normalizedFieldName, 10);

    return Number.isFinite(parsedInputId) ? parsedInputId : normalizedFieldName;
}

function getNormalizedValues(rawValue) {
    if (Array.isArray(rawValue)) {
        return rawValue
            .map((value) => normalizeControlValue(value))
            .filter(Boolean);
    }

    const normalizedValue = normalizeControlValue(rawValue);

    return normalizedValue ? [normalizedValue] : [];
}

function createOptionValueLookup(input) {
    const rawOptions = Array.isArray(input?.settings?.options) ? input.settings.options : [];
    const optionValueByLookup = new Map();

    rawOptions.forEach((option) => {
        if (typeof option === 'string') {
            const normalizedOptionValue = normalizeControlValue(option);
            
            if (normalizedOptionValue) {
                optionValueByLookup.set(normalizedOptionValue, normalizedOptionValue);
            }

            return;
        }

        const optionValue = pickFirstNormalizedValue(option, OPTION_VALUE_KEYS);

        if (!optionValue) {
            return;
        }

        OPTION_LOOKUP_KEYS.forEach((lookupKeyName) => {
            const lookupKey = normalizeControlValue(option?.[lookupKeyName]);

            if (lookupKey) {
                optionValueByLookup.set(lookupKey, optionValue);
            }
        });
    });

    return optionValueByLookup;
}

export default function buildSubmissionPayload(inputSettings, values) {
    const inputMeta = inputSettings.map((input) => {
        const fieldName = getFieldName(input);

        return {
            fieldName,
            id: getInputIdByFieldName(fieldName),
            optionValueLookup: createOptionValueLookup(input),
        };
    });

    return inputMeta.map((field) => {
        const normalizedValues = getNormalizedValues(values[field.fieldName]);
        const value = normalizedValues
            .map((entry) => field.optionValueLookup.get(entry) || entry)
            .join(',');

        return {
            id: field.id,
            value,
        };
    });
}
