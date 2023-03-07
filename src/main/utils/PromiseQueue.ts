import { OpenPromise, OpenPromiseState } from '@recative/open-promise';

export class PromiseQueue {
  private finalPromise = new OpenPromise<void>();

  private queue: Array<() => Promise<unknown>> = [];

  private running = false;

  private stopped = false;

  constructor(readonly concurrent = 1) {}

  get length() {
    return this.queue.length;
  }

  enqueue = (task: () => Promise<any>) => {
    if (this.running) {
      throw new Error('Cannot add new task after queue started running.');
    }

    if (this.stopped) {
      throw new Error('Cannot add new task after queue stopped.');
    }

    this.queue.push(task);
  };

  finished = 0;

  totalTasksBeforeLocked = 0;

  rejected = 0;

  resolved = 0;

  working = 0;

  promisePointer = -1;

  handlePromise = (p: Promise<unknown>): Promise<void> => {
    if (this.stopped) return Promise.resolve();

    this.promisePointer += 1;
    this.working += 1;

    return p
      .then(() => {
        this.resolved += 1;
      })
      .catch(() => {
        this.rejected += 1;
      })
      .finally(() => {
        this.finished += 1;
        this.working -= 1;

        if (this.finished >= this.totalTasksBeforeLocked) {
          if (
            this.finalPromise.state !== OpenPromiseState.Idle &&
            this.finalPromise.state !== OpenPromiseState.Pending
          ) {
            return;
          }

          if (this.rejected > 0) {
            this.finalPromise.reject(
              new Error(`Not all task finished successfully`)
            );
          } else {
            this.finalPromise.resolve();
          }
          return;
        }

        if (this.promisePointer >= this.queue.length) {
          return;
        }

        const promise = this.queue[this.promisePointer]();

        return this.handlePromise(promise);
      });
  };

  run = () => {
    if (this.running) {
      throw new Error(`The task is already running`);
    }
    if (this.stopped) {
      throw new Error(`The task was stopped`);
    }

    this.running = true;
    this.totalTasksBeforeLocked = this.queue.length;

    if (this.queue.length <= 0) {
      this.finalPromise.resolve();
      return;
    }

    for (
      let i = 0;
      i < Math.min(this.totalTasksBeforeLocked, this.concurrent);
      i += 1
    ) {
      void this.handlePromise(this.queue[i]());
    }

    return this.finalPromise;
  };

  stop = () => {
    this.stopped = true;

    this.finalPromise.resolve();
    return this.finalPromise;
  };
}
