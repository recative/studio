import log from 'electron-log';

const LOG_PERFORMANCE = false;

export const PerformanceLog = (id: string) => {
  let lastTime = performance.now();

  const internalLog = (task: string) => {
    if (!LOG_PERFORMANCE) return;
    const currentTime = performance.now();

    const ΔT = currentTime - lastTime;

    if (ΔT < 50) {
      log.debug(`:: :: :: [${id}] [${task}] Took ${ΔT} ms`);
    } else if (ΔT < 200) {
      log.log(`:: :: :: [${id}] [${task}] Took ${ΔT} ms`);
    } else if (ΔT < 500) {
      log.warn(`:: :: :: [${id}] [${task}] Took ${ΔT} ms`);
    } else {
      log.error(`:: :: :: [${id}] [${task}] Took ${ΔT} ms`);
    }

    lastTime = currentTime;
  };

  return internalLog;
};
