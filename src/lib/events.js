// Event system для оновлення даних після додавання / видалення
export const Events = {
  JOB_ADDED: 'job:added',
  HOUSING_ADDED: 'housing:added',
  SERVICE_ADDED: 'service:added',
  FORUM_POST_ADDED: 'forum_post:added',
  JOB_DELETED: 'job:deleted',
  HOUSING_DELETED: 'housing:deleted',
  SERVICE_DELETED: 'service:deleted',
  FORUM_POST_DELETED: 'forum_post:deleted',
};

export const emitEvent = (eventName) => {
  window.dispatchEvent(new CustomEvent(eventName));
};

export const onEvent = (eventName, callback) => {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
};
