/*
 * Temperature Converter - Chromium extension to convert temperature units.
 * Copyright (C) 2026 Grace Smith, Alexey Ayzin,
 * Susan Thao, Aleksandr Nuzhnyi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact and attribution information is in NOTICE.
 */
(() => {
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('message');
    const toggleButton = document.getElementById('toggle');
    const refreshButton = document.getElementById('refresh');
    const modeInputs = Array.from(
        document.querySelectorAll('input[name="mode"]'),
    );

    const MODE_LABELS = {
        c_to_f: 'C to F',
        f_to_c: 'F to C',
        off: 'Off',
    };

    function setMessage(text, tone) {
        if (!messageEl) return;
        messageEl.textContent = text;
        if (tone) {
            messageEl.dataset.tone = tone;
        } else {
            delete messageEl.dataset.tone;
        }
    }

    function setStatus(mode) {
        if (!statusEl) return;
        const label = MODE_LABELS[mode];
        if (!label) {
            statusEl.textContent = 'Current mode: Unknown';
            return;
        }
        statusEl.textContent = `Current mode: ${label}`;
        modeInputs.forEach((input) => {
            input.checked = input.value === mode;
        });
    }

    function setEnabled(enabled) {
        modeInputs.forEach((input) => {
            input.disabled = !enabled;
        });
        if (toggleButton) toggleButton.disabled = !enabled;
        if (refreshButton) refreshButton.disabled = !enabled;
    }

    function getActiveTab() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const lastError = chrome.runtime.lastError;
                if (lastError) {
                    reject(new Error(lastError.message));
                    return;
                }
                if (!tabs || !tabs[0]) {
                    reject(new Error('No active tab'));
                    return;
                }
                resolve(tabs[0]);
            });
        });
    }

    function sendMessage(tabId, payload) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, payload, (response) => {
                const lastError = chrome.runtime.lastError;
                if (lastError) {
                    reject(new Error(lastError.message));
                    return;
                }
                resolve(response);
            });
        });
    }

    async function sendToActiveTab(payload) {
        const tab = await getActiveTab();
        return sendMessage(tab.id, payload);
    }

    async function refreshStatus() {
        setMessage('');
        setEnabled(true);
        try {
            const response = await sendToActiveTab({ command: 'status' });
            if (response && response.mode) {
                setStatus(response.mode);
                setMessage('Ready.', 'success');
                return;
            }
            setStatus('unknown');
            setMessage('No response from page.', 'error');
        } catch (error) {
            setStatus('unknown');
            setMessage('Open a normal web page to use converter.', 'error');
            setEnabled(false);
        }
    }

    async function setMode(mode) {
        setMessage('');
        setEnabled(true);
        try {
            const response = await sendToActiveTab({ mode });
            if (response && response.mode) {
                setStatus(response.mode);
                setMessage('Mode updated.', 'success');
                return;
            }
            setMessage('No response from page.', 'error');
        } catch (error) {
            setMessage('Unable to reach the page.', 'error');
            setEnabled(false);
        }
    }

    modeInputs.forEach((input) => {
        input.addEventListener('change', () => {
            if (input.checked) {
                setMode(input.value);
            }
        });
    });

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            setMode('toggle');
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', refreshStatus);
    }

    refreshStatus();
})();
