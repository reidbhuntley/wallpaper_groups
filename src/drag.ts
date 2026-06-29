namespace Drag {
    export type Pos = {
        touchId: number | null;
        clientX: number;
        clientY: number;
    };

    export type Movement = {
        touchId: number | null;
        movementX: number;
        movementY: number;
    };

    export type Event = {
        parent: MouseEvent | TouchEvent;
        drags: Pos[];
    };

    export function createEvent(event: MouseEvent | TouchEvent): Event {
        let drags: Pos[];

        if (event instanceof MouseEvent) {
            if (event.buttons & 1) {
                drags = [
                    {
                        touchId: null,
                        clientX: event.clientX,
                        clientY: event.clientY,
                    },
                ];
            } else {
                drags = [];
            }
        } else {
            drags = Array.from(event.touches).map((touch) => {
                return {
                    touchId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                };
            });
        }

        return {
            parent: event,
            drags,
        };
    }

    export function getChanges(
        eventCur: Event,
        eventPrev: Event | null,
    ): Movement[] {
        const dragsPrev = eventPrev?.drags ?? [];
        const dragsPrevMap = dragsPrev.reduce(
            (map, dragger) => {
                map.set(dragger.touchId, dragger);
                return map;
            },
            new Map() as Map<number | null, Pos>,
        );

        return eventCur.drags.map((dragCur) => {
            const dragPrev = dragsPrevMap.get(dragCur.touchId);
            if (dragPrev === undefined) {
                return {
                    touchId: dragCur.touchId,
                    movementX: 0,
                    movementY: 0,
                };
            } else {
                return {
                    touchId: dragCur.touchId,
                    movementX: dragCur.clientX - dragPrev.clientX,
                    movementY: dragCur.clientY - dragPrev.clientY,
                };
            }
        });
    }
}

export { Drag };
