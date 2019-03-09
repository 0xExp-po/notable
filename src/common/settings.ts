
/* IMPORT */

import * as os from 'os';
import * as Store from 'electron-store';

/* SETTINGS */

const Settings = new Store ({
  name: '.notable',
  cwd: os.homedir (),
  defaults: {
    cwd: undefined,
    monaco: {
      editorOptions: {
        minimap: {
          enabled: false
        },
        wordWrap: 'bounded'
      }
    },
    sorting: {
      by: 'title',
      type: 'ascending'
    },
    tutorial: false // Did we import the tutorial yet?
  }
});

/* EXPORT */

export default Settings;
