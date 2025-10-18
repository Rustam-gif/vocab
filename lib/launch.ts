export type Unsub = () => void;

class LaunchBus {
  private _done = false;
  private listeners: Array<() => void> = [];

  isDone() {
    return this._done;
  }

  onDone(cb: () => void): Unsub {
    if (this._done) {
      try { cb(); } catch {}
      return () => {};
    }
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  markDone() {
    if (this._done) return;
    this._done = true;
    const cbs = [...this.listeners];
    this.listeners = [];
    cbs.forEach(cb => { try { cb(); } catch {} });
  }
}

export const Launch = new LaunchBus();

