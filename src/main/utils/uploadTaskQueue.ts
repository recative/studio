import Queue from 'queue-promise';

let uploadLock = false;

export const getUploadLock = () => uploadLock;
export const setUploadLock = (x: boolean) => {
  uploadLock = x;
};

export class TaskQueue extends Queue {
  run = () => {
    return new Promise<void>((resolve, reject) => {
      this.start();
      this.on('end', () => {
        uploadLock = false;
        resolve();
      });
      this.on('reject', (error) => {
        reject(error);
      });
    });
  };
}
