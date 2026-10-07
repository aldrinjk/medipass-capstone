const storage = new Map();

module.exports = {
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  ALWAYS: 'ALWAYS',
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',

  isAvailableAsync: jest.fn().mockResolvedValue(true),

  setItemAsync: jest.fn(async (key, value) => {
    storage.set(key, String(value));
  }),

  getItemAsync: jest.fn(async (key) => {
    return storage.has(key) ? storage.get(key) : null;
  }),

  deleteItemAsync: jest.fn(async (key) => {
    storage.delete(key);
  }),

  _clear: () => {
    storage.clear();
  },
};
