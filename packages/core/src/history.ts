/** Undo and redo over immutable snapshots. Push a new value after each edit. */
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  private current: T;
  private readonly limit: number;

  constructor(initial: T, limit = 100) {
    this.current = initial;
    this.limit = limit;
  }

  get present(): T {
    return this.current;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  push(next: T): T {
    if (next === this.current) return this.current;
    this.past.push(this.current);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
    this.current = next;
    return next;
  }

  undo(): T {
    const prev = this.past.pop();
    if (prev !== undefined) {
      this.future.push(this.current);
      this.current = prev;
    }
    return this.current;
  }

  redo(): T {
    const next = this.future.pop();
    if (next !== undefined) {
      this.past.push(this.current);
      this.current = next;
    }
    return this.current;
  }
}
