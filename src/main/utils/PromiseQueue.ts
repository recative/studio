import console from 'electron-log';
import { OpenPromise } from '@recative/open-promise';

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

  rejected = 0;

  resolved = 0;

  working = 0;

  promisePointer = -1;

  handlePromise = (p: Promise<unknown>) => {
    console.log(':: Promise triggered');
    if (this.stopped) return;

    this.promisePointer += 1;
    this.working += 1;

    p.then(() => {
      this.resolved += 1;
    })
      .catch(() => {
        this.rejected += 1;
      })
      .finally(() => {
        this.working -= 1;

        if (this.resolved >= this.queue.length) {
          this.finalPromise.resolve();
        }

        if (this.promisePointer >= this.queue.length - 1) {
          return;
        }

        const promise = this.queue[this.promisePointer]();

        this.handlePromise(promise);
      });
  };

  run = () => {
    console.log(':: Queue running triggered running');
    this.running = true;

    if (this.running) return;
    if (this.stopped) return;

    for (let i = 0; i < Math.min(this.length, this.concurrent); i += 1) {
      this.handlePromise(this.queue[i]());
    }

    return this.finalPromise;
  };

  stop = () => {
    this.stopped = true;

    this.finalPromise.resolve();
    return this.finalPromise;
  };
}
