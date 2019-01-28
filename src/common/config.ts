
/* IMPORT */

import * as path from 'path';
import Settings from './settings';

/* CONFIG */

const Config = {
  autoupdate: true,
  get cwd () {
    return Settings.get ( 'cwd' );
  },
  attachments: {
    get path () {
      const cwd = Config.cwd;
      return cwd ? path.join ( cwd, 'attachments' ) : undefined;
    },
    glob: '**/*',
    re: /./,
    token: '@attachment' // Usable in urls
  },
  notes: {
    get path () {
      const cwd = Config.cwd;
      return cwd ? path.join ( cwd, 'notes' ) : undefined;
    },
    glob: '**/*.{md,mkd,mdwn,mdown,markdown,markdn,mdtxt,mdtext,txt}',
    re: /\.(?:md|mkd|mdwn|mdown|markdown|markdn|mdtxt|mdtext|txt)$/,
    token: '@note' // Usable in urls
  },
  tags: {
    token: '@tag' // Usable in urls
  },
  search: {
    tokenizer: /\s+/g
  },
  sorting: {
    by: Settings.get ( 'sorting.by' ),
    type: Settings.get ( 'sorting.type' )
  },
  katex: {
    throwOnError: true,
    displayMode: false,
    errorColor: '#f44336'
  },
  mermaid: { //URL: https://github.com/knsv/mermaid/blob/7d3578b31aeea3bc9bbc618dcda57d82574eaffb/src/mermaidAPI.js#L51
    gantt: {
      barHeight: 25,
      fontSize: 14
    }
  }
};

/* EXPORT */

export default Config;
