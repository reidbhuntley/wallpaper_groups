import type { WallpaperGroupKind } from "./wallpaper_group";

class GroupSelectController {
    onChange: ((kind: WallpaperGroupKind) => void) | null = null;
    private select: HTMLSelectElement;

    constructor(
        select: HTMLSelectElement,
        buttonPrev: HTMLElement,
        buttonNext: HTMLElement,
    ) {
        this.select = select;

        for (const kind of GROUPS) {
            select.appendChild(new Option(kind, kind));
        }
        select.selectedIndex = 0;

        select.addEventListener("change", () => {
            this.onSelectChange();
        });
        buttonPrev.addEventListener("click", () => {
            this.onClickPrev();
        });
        buttonNext.addEventListener("click", () => {
            this.onClickNext();
        });
    }

    private onSelectChange() {
        if (this.onChange !== null) {
            this.onChange(this.select.value as WallpaperGroupKind);
        }
    }

    private onClickPrev() {
        if (this.select.selectedIndex === 0) {
            this.select.selectedIndex = GROUPS.length - 1;
        } else {
            this.select.selectedIndex -= 1;
        }

        this.onSelectChange();
    }

    private onClickNext() {
        if (this.select.selectedIndex === GROUPS.length - 1) {
            this.select.selectedIndex = 0;
        } else {
            this.select.selectedIndex += 1;
        }

        this.onSelectChange();
    }
}

const GROUPS: WallpaperGroupKind[] = [
    "p1",
    "p2",
    "pm",
    "pg",
    "cm",
    "pmm",
    "pmg",
    "pgg",
    "cmm",
    "p4",
    "p4m",
    "p4g",
    "p3",
    "p3m1",
    "p31m",
    "p6",
    "p6m",
];

export { GroupSelectController };
