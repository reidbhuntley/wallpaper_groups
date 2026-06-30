type Popup = {
    openButton: Element;
    body: Element;
};

class PopupController {
    popups: Popup[];
    onClose: (() => void) | null = null;

    constructor(popups: Popup[], closeButtons: Element[]) {
        this.popups = popups;
        for (const popup of popups) {
            popup.openButton.addEventListener("click", (e) => {
                this.open(e.currentTarget);
            });
        }
        for (const closeButton of closeButtons) {
            closeButton.addEventListener("click", (e) => {
                if (e.target === closeButton) {
                    this.closeAll();
                }
            });
        }
    }

    open(openButton: EventTarget | null) {
        for (const popup of this.popups) {
            if (openButton === popup.openButton) {
                popup.body.classList.add("open");
            } else {
                popup.body.classList.remove("open");
            }
        }
    }

    closeAll() {
        for (const popup of this.popups) {
            popup.body.classList.remove("open");
        }

        if (this.onClose !== null) {
            this.onClose();
        }
    }
}

export { PopupController };
