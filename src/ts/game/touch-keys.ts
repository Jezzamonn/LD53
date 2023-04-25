import { RegularKeys } from "../lib/keys";

export enum UiState {
    Hidden = 0,
    Platforming = 1,
}

export class TouchKeys extends RegularKeys {
    #pressedKeys: Set<string> = new Set();
    #pressedThisFrame: Set<string> = new Set();
    #releasedThisFrame: Set<string> = new Set();

    #uiState = UiState.Platforming;
    #hadTouchEvent = false;

    setUp(): void {
        this.waitForFirstTouchEvent();
    }

    waitForFirstTouchEvent(): void {
        const boundEnableTouchControls = () => {
            this.enableTouchControls();
            window.removeEventListener('touchstart', boundEnableTouchControls);
        }

        window.addEventListener('touchstart', boundEnableTouchControls);
    }

    enableTouchControls(): void {
        this.#hadTouchEvent = true;
        this.updateUiState();
        this.addListeners();
    }

    setUiState(state: UiState): void {
        this.#uiState = state;
        this.updateUiState();
    }

    updateUiState() {
        if (!this.#hadTouchEvent) {
            return;
        }
        const buttons = document.querySelector('.touch-buttons')!;

        switch (this.#uiState) {
            case UiState.Hidden:
                buttons.classList.add('hidden');
                break;
            case UiState.Platforming:
                buttons.classList.remove('hidden');
                break;
        }
    }

    addListeners(): void {
        this.addMoveButtonListener('.touch-button-left-right', ['TouchButtonLeft', 'TouchButtonRight']);
        this.addButtonListener('.touch-button-jump', 'TouchButtonJump');
        this.addButtonListener('.touch-button-plant', 'TouchButtonPlant');
        this.addButtonListener('.touch-button-restart', 'TouchButtonRestart');

        // Also add a listener for the whole window.
        this.addButtonListener(window, 'AnyTouch');
    }

    addButtonListener(elemOrSelector: HTMLElement | Window | string, keyCode: string): void {
        let elem: HTMLElement | Window;
        if (typeof elemOrSelector === 'string') {
            elem = document.querySelector(elemOrSelector) as HTMLElement;

            if (!elem) {
                console.error(`Can't find the touch target ${elem}. That's weird.`);
                return;
            }
        }
        else {
            elem = elemOrSelector;
        }

        const updateFromTargetTargets = (evt: TouchEvent) => {
            if (evt.targetTouches.length > 0) {
                if (!this.#pressedKeys.has(keyCode)) {
                    this.#pressedThisFrame.add(keyCode);
                    console.log('Pressed', keyCode)
                }
                this.#pressedKeys.add(keyCode);
            }
            else {
                if (!this.#pressedKeys.has(keyCode)) {
                    this.#releasedThisFrame.add(keyCode);
                    console.log('Released', keyCode)
                }
                this.#pressedKeys.delete(keyCode);
            }

            evt.preventDefault();
        }

        console.log('Adding touch listeners to', elem, keyCode)

        // TypeScript can't handle the types of these events, sadly.
        elem.addEventListener('touchstart', updateFromTargetTargets as any, { passive: false });
        elem.addEventListener('touchend', updateFromTargetTargets as any, { passive: false });
        elem.addEventListener('touchcancel', updateFromTargetTargets as any, { passive: false });
    }

    // This could be made a bit more general.
    addMoveButtonListener(elemOrSelector: HTMLElement | string, keyCodes: string[]): void {
        let elem: HTMLElement;
        if (typeof elemOrSelector === 'string') {
            elem = document.querySelector(elemOrSelector) as HTMLElement;

            if (!elem) {
                console.error(`Can't find the touch target ${elem}. That's weird.`);
                return;
            }
        }
        else {
            elem = elemOrSelector;
        }

        const updateFromTargetTargets = (evt: TouchEvent) => {
            const bounds = elem.getBoundingClientRect();
            const middle = (bounds.left + bounds.right) / 2;

            const activeTouches = new Set<string>();
            for (let i = 0; i < evt.targetTouches.length; i++) {
                const touch = evt.targetTouches.item(i)!;
                if (touch.clientX < middle) {
                    activeTouches.add(keyCodes[0]);
                }
                else {
                    activeTouches.add(keyCodes[1]);
                }
            }

            for (const keyCode of keyCodes) {
                if (activeTouches.has(keyCode)) {
                    if (!this.#pressedKeys.has(keyCode)) {
                        this.#pressedThisFrame.add(keyCode);
                        console.log('Pressed', keyCode)
                    }
                    this.#pressedKeys.add(keyCode);
                }
                else {
                    if (!this.#pressedKeys.has(keyCode)) {
                        this.#releasedThisFrame.add(keyCode);
                        console.log('Released', keyCode)
                    }
                    this.#pressedKeys.delete(keyCode);
                }
            }
        }

        console.log('Adding touch listeners to', elem, keyCodes)

        elem.addEventListener('touchstart', updateFromTargetTargets);
        elem.addEventListener('touchmove', updateFromTargetTargets);
        elem.addEventListener('touchend', updateFromTargetTargets);
        elem.addEventListener('touchcancel', updateFromTargetTargets);
    }


    resetFrame(): void {
        this.#pressedThisFrame.clear();
        this.#releasedThisFrame.clear();
    }

    isPressed(keyCode: string): boolean {
        return this.#pressedKeys.has(keyCode);
    }

    wasPressedThisFrame(keyCode: string): boolean {
        return this.#pressedThisFrame.has(keyCode);
    }

    wasReleasedThisFrame(keyCode: string): boolean {
        return this.#releasedThisFrame.has(keyCode);
    }
}
