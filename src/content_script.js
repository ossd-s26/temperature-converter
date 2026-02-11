(() => {
    const MODE_C_TO_F = 'c_to_f';
    const MODE_F_TO_C = 'f_to_c';
    const MODE_OFF = 'off';

    const SKIP_TAGS = new Set([
        'SCRIPT',
        'STYLE',
        'NOSCRIPT',
        'TEXTAREA',
        'INPUT',
        'CODE',
        'PRE',
    ]);

    let currentMode = MODE_OFF;
    let pageUnit = null;
    let isApplying = false;
    let lastUnitDetection = 0;
    let observer = null;
    const observedRoots = new WeakSet();
    const originalTextByNode = new WeakMap();

    const numberPattern = '([+-]?\\d+(?:,\\d{3})*(?:\\.\\d+)?)';
    const degreePattern = '(?:°|º|deg(?:rees?)?)';
    const cRegex = new RegExp(
        `${numberPattern}\\s*${degreePattern}?\\s*C\\b`,
        'gi',
    );
    const fRegex = new RegExp(
        `${numberPattern}\\s*${degreePattern}?\\s*F\\b`,
        'gi',
    );
    const unitlessRegex = new RegExp(
        `${numberPattern}\\s*${degreePattern}(?!\\s*[CF])`,
        'gi',
    );
    const cHintRegex = /(?:°|º)\s*C\b|celsius\b/gi;
    const fHintRegex = /(?:°|º)\s*F\b|fahrenheit\b/gi;

    function parseNumber(value) {
        return parseFloat(value.replace(/,/g, ''));
    }

    function formatTemp(value) {
        const rounded = Math.round(value * 10) / 10;
        return rounded.toLocaleString('en-US', {
            maximumFractionDigits: 1,
            minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
        });
    }

    function cToF(celsius) {
        return (celsius * 9) / 5 + 32;
    }

    function fToC(fahrenheit) {
        return ((fahrenheit - 32) * 5) / 9;
    }

    function countMatches(regex, text) {
        if (!text) return 0;
        let count = 0;
        regex.lastIndex = 0;
        let match = regex.exec(text);
        while (match) {
            count += 1;
            match = regex.exec(text);
        }
        return count;
    }

    function detectPageUnit(root) {
        if (!root) return null;
        let cCount = 0;
        let fCount = 0;
        const stack = [root];

        while (stack.length) {
            const node = stack.pop();
            if (!node) continue;
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue || '';
                cCount += countMatches(cHintRegex, text);
                fCount += countMatches(fHintRegex, text);
                continue;
            }
            if (
                node.nodeType !== Node.ELEMENT_NODE &&
                node.nodeType !== Node.DOCUMENT_NODE &&
                node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
            ) {
                continue;
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.nodeName;
                if (SKIP_TAGS.has(tagName) || isEditableElement(node)) continue;
                if (node.shadowRoot) {
                    stack.push(node.shadowRoot);
                }
            }

            let child = node.firstChild;
            while (child) {
                stack.push(child);
                child = child.nextSibling;
            }
        }

        if (cCount > fCount) return 'c';
        if (fCount > cCount) return 'f';
        return null;
    }

    function isPlausibleTemp(value, mode) {
        if (!Number.isFinite(value)) return false;
        if (mode === MODE_C_TO_F) {
            return value >= -100 && value <= 100;
        }
        if (mode === MODE_F_TO_C) {
            return value >= -150 && value <= 200;
        }
        return false;
    }

    function shouldConvertUnitless(value, mode, unitHint) {
        if (unitHint === 'c') return mode === MODE_C_TO_F;
        if (unitHint === 'f') return mode === MODE_F_TO_C;
        return isPlausibleTemp(value, mode);
    }

    function convertTemperatureText(text, mode, pageUnit) {
        if (mode === MODE_C_TO_F) {
            let updated = text.replace(cRegex, (match, value) => {
                const parsed = parseNumber(value);
                if (Number.isNaN(parsed)) return match;
                const converted = formatTemp(cToF(parsed));
                return `${converted}°F`;
            });
            updated = updated.replace(unitlessRegex, (match, value) => {
                const parsed = parseNumber(value);
                if (Number.isNaN(parsed)) return match;
                if (!shouldConvertUnitless(parsed, mode, pageUnit))
                    return match;
                const converted = formatTemp(cToF(parsed));
                return `${converted}°F`;
            });
            return updated;
        }
        if (mode === MODE_F_TO_C) {
            let updated = text.replace(fRegex, (match, value) => {
                const parsed = parseNumber(value);
                if (Number.isNaN(parsed)) return match;
                const converted = formatTemp(fToC(parsed));
                return `${converted}°C`;
            });
            updated = updated.replace(unitlessRegex, (match, value) => {
                const parsed = parseNumber(value);
                if (Number.isNaN(parsed)) return match;
                if (!shouldConvertUnitless(parsed, mode, pageUnit))
                    return match;
                const converted = formatTemp(fToC(parsed));
                return `${converted}°C`;
            });
            return updated;
        }
        return text;
    }

    function isEditableElement(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
        const element = node;
        if (element.isContentEditable) return true;
        if (element.getAttribute('role') === 'textbox') return true;
        return false;
    }

    function walk(node) {
        if (!node) return;

        switch (node.nodeType) {
            case Node.TEXT_NODE:
                processTextNode(node);
                return;
            case Node.ELEMENT_NODE:
            case Node.DOCUMENT_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE:
                break;
            default:
                return;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.nodeName;
            if (SKIP_TAGS.has(tagName) || isEditableElement(node)) return;
            if (node.shadowRoot) {
                observeRoot(node.shadowRoot);
                walk(node.shadowRoot);
            }
        }

        let child = node.firstChild;
        while (child) {
            const next = child.nextSibling;
            walk(child);
            child = next;
        }
    }

    function processTextNode(textNode) {
        if (!textNode.nodeValue || !textNode.nodeValue.trim()) return;

        if (currentMode === MODE_OFF) {
            const original = originalTextByNode.get(textNode);
            if (original !== undefined && textNode.nodeValue !== original) {
                textNode.nodeValue = original;
            }
            if (original !== undefined) {
                originalTextByNode.delete(textNode);
            }
            return;
        }

        let original = originalTextByNode.get(textNode);
        if (original === undefined) {
            original = textNode.nodeValue;
            originalTextByNode.set(textNode, original);
        }

        const converted = convertTemperatureText(
            original,
            currentMode,
            pageUnit,
        );
        if (converted !== textNode.nodeValue) {
            textNode.nodeValue = converted;
        }
    }

    function getRoot() {
        return document.body || document.documentElement;
    }

    function applyToRoot(root) {
        if (!root || isApplying) return;
        isApplying = true;
        pageUnit = currentMode === MODE_OFF ? null : detectPageUnit(root);
        lastUnitDetection = Date.now();
        walk(root);
        isApplying = false;
    }

    function setMode(mode) {
        if (![MODE_C_TO_F, MODE_F_TO_C, MODE_OFF].includes(mode)) return;

        const root = getRoot();
        if (currentMode !== MODE_OFF) {
            currentMode = MODE_OFF;
            applyToRoot(root);
        }

        currentMode = mode;
        if (currentMode !== MODE_OFF) {
            applyToRoot(root);
        }
    }

    function normalizeMode(request) {
        if (!request) return null;
        if (typeof request.mode === 'string') return request.mode.toLowerCase();
        if (typeof request.direction === 'string')
            return request.direction.toLowerCase();
        if (typeof request.command === 'string')
            return request.command.toLowerCase();
        return null;
    }

    function observeRoot(root) {
        if (!root || observedRoots.has(root) || !observer) return;
        observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
        });
        observedRoots.add(root);
    }

    function startObserver() {
        const root = getRoot();
        if (!root) return;

        observer = new MutationObserver((mutations) => {
            if (currentMode === MODE_OFF || isApplying) return;
            if (Date.now() - lastUnitDetection > 1000) {
                pageUnit = detectPageUnit(root);
                lastUnitDetection = Date.now();
            }
            for (const mutation of mutations) {
                if (mutation.type === 'characterData') {
                    processTextNode(mutation.target);
                    continue;
                }
                for (const added of mutation.addedNodes) {
                    walk(added);
                }
            }
        });

        observeRoot(root);

        if (currentMode !== MODE_OFF) {
            applyToRoot(root);
        }
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const normalized = normalizeMode(request);

        if (normalized === 'toggle') {
            const next =
                currentMode === MODE_C_TO_F ? MODE_F_TO_C : MODE_C_TO_F;
            setMode(next);
            sendResponse({ ok: true, mode: currentMode });
            return;
        }

        if (
            normalized === MODE_C_TO_F ||
            normalized === MODE_F_TO_C ||
            normalized === MODE_OFF
        ) {
            setMode(normalized);
            sendResponse({ ok: true, mode: currentMode });
            return;
        }

        if (request && request.command === 'status') {
            sendResponse({ ok: true, mode: currentMode });
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver, {
            once: true,
        });
    } else {
        startObserver();
    }
})();
