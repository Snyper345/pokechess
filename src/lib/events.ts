type Listener<T = void> = (payload: T) => void;

class EventEmitter<T = void> {
    private listeners: Set<Listener<T>> = new Set();

    subscribe(listener: Listener<T>) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    emit(payload: T) {
        this.listeners.forEach((l) => l(payload));
    }
}

export const shakeEvent = new EventEmitter();

export interface BattlePayload {
    attacker: { type: string; color: string; isEvolved?: boolean };
    defender: { type: string; color: string; isEvolved?: boolean };
}
export const battleEvent = new EventEmitter<BattlePayload>();
