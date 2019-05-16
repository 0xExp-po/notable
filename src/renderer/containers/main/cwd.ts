
/* IMPORT */

import {ipcRenderer as ipc, remote, shell} from 'electron';
import Dialog from 'electron-dialog';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as os from 'os';
import {Container, autosuspend} from 'overstated';
import * as path from 'path';
import * as pify from 'pify';
import Config from '@common/config';
import Settings from '@common/settings';
import File from '@renderer/utils/file';
import Markdown from '@renderer/utils/markdown';

/* CWD */

class CWD extends Container<CWDState, IMain> {

  /* CONSTRUCTOR */

  constructor () {

    super ();

    autosuspend ( this );

  }

  /* API */

  get = () => {

    return Config.cwd;

  }

  set = async ( folderPath: string ) => {

    if ( this.get () === folderPath ) return Dialog.alert ( 'That is already the current data directory' );

    try {

      const hadTutorial = !!Settings.get ( 'tutorial' );

      await pify ( mkdirp )( folderPath );

      await pify ( fs.access )( folderPath, fs.constants.F_OK );

      Settings.set ( 'cwd', folderPath );

      const notesPath = Config.notes.path,
            hadNotes = ( notesPath && await File.exists ( notesPath ) );

      if ( !hadTutorial && !hadNotes ) {

        await this.ctx.tutorial.import ();

        Settings.set ( 'tutorial', true );

      }

      if ( !this.ctx.loading.get () ) { // Already loaded, refreshing

        await this.ctx.note.autosave ();
        await this.ctx.loading.reset ();

        Markdown.converters.refresh ();

        setTimeout ( this.ctx.reset ); // Ensuring the app gets repainted first

      } else { // Reopening

        ipc.send ( 'cwd-changed' );

      }

    } catch ( e ) {

      Dialog.alert ( `Couldn't access path: "${folderPath}"` );
      Dialog.alert ( e.message );

    }

  }

  select = () => {

    const folderPath = this.dialog ();

    if ( !folderPath ) return;

    return this.set ( folderPath );

  }

  selectDefault = () => {

    const folderPath = path.join ( os.homedir (), '.notable' );

    return this.set ( folderPath );

  }

  openInApp = () => {

    const cwd = this.get ();

    if ( !cwd ) return Dialog.alert ( 'No data directory set' );

    shell.openItem ( cwd );

  }

  dialog = (): string | undefined => {

    const cwd = this.get (),
          defaultPath = cwd ? path.dirname ( cwd ) : os.homedir ();

    const folderPaths = remote.dialog.showOpenDialog ({
      title: 'Select Data Directory',
      buttonLabel: 'Select',
      properties: ['openDirectory', 'createDirectory', 'showHiddenFiles'],
      defaultPath
    });

    if ( !folderPaths || !folderPaths.length ) return;

    return folderPaths[0];

  }

}

/* EXPORT */

export default CWD;
