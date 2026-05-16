/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};
