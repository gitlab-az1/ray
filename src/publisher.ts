import { EventEmitter, Event as BaseEvent } from 'not-synchronous/events';

import { logger } from '@env';
import getAppStore from '@@internals/app-stores';



/* events */
class TopicEvent<T = any> extends BaseEvent<T> {
  public constructor(target: T) {
    super('topic', target, { cancelable: true });
  }
}
/* events */


export class Publisher<
  TopicsMap extends Record<string, any> = Record<string, any>
> {
  #ee: EventEmitter;

  public constructor() {
    this.#ee = new EventEmitter({ onListenerError: logger.error });
  }

  public async publish<K extends keyof TopicsMap = keyof TopicsMap>(
    topic: K,
    data: TopicsMap[K] // eslint-disable-line comma-dangle
  ): Promise<void> {
    const store = getAppStore('pubsub');
  }
}

export default Publisher;
