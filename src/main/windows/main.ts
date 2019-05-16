
/* IMPORT */

import * as _ from 'lodash';
import {BrowserWindowConstructorOptions, Event, ipcMain as ipc, BrowserWindow, Menu, MenuItemConstructorOptions, shell} from 'electron';
import {is} from 'electron-util';
import * as windowStateKeeper from 'electron-window-state';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import pkg from '@root/package.json';
import Environment from '@common/environment';
import UMenu from '@main/utils/menu';
import About from './about';
import Mermaid from './mermaid';
import Route from './route';

/* MAIN */

class Main extends Route {

  /* VARIABLES */

  _prevKeys: ContextKeysObj | false = false;
  _prevUpdateCheckTimestamp: number = 0;

  /* CONSTRUCTOR */

  constructor ( name = 'main', options: BrowserWindowConstructorOptions = { minWidth: 685, minHeight: 425 }, stateOptions: windowStateKeeper.Options = { defaultWidth: 850, defaultHeight: 525 } ) {

    super ( name, options, stateOptions );

  }

  /* SPECIAL */

  initLocalShortcuts () {}

  initMenu ( keys: ContextKeysObj | false = this._prevKeys ) {

    this._prevKeys = keys; // Storing them because they are needed also when focusing to the window

    const updaterCanCheck = this._updaterCanCheck ();

    const template: MenuItemConstructorOptions[] = UMenu.filterTemplate ([
      {
        label: pkg.productName,
        submenu: [
          {
            label: `About ${pkg.productName}`,
            click: () => new About ().init ()
          },
          {
            label: updaterCanCheck ? 'Check for Updates...' : 'Checking for Updates...',
            enabled: updaterCanCheck,
            click: this._updaterCheck
          },
          {
            type: 'separator'
          },
          {
            label: 'Open Data Directory',
            click: () => this.win.webContents.send ( 'cwd-open-in-app' )
          },
          {
            label: 'Change Data Directory...',
            click: () => this.win.webContents.send ( 'cwd-change' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Theme',
            submenu: [
              {
                type: 'checkbox',
                label: 'Light',
                click: () => this.win.webContents.send ( 'theme-set', 'light' ),
                checked: !keys || keys.theme === 'light'
              },
              {
                type: 'checkbox',
                label: 'Dark',
                click: () => this.win.webContents.send ( 'theme-set', 'dark' ),
                checked: !!keys && keys.theme === 'dark'
              }
            ]
          },
          {
            type: 'separator'
          },
          {
            role: 'services',
            submenu: [] ,
            visible: is.macos
          },
          {
            type: 'separator',
            visible: is.macos
          },
          {
            role: 'hide',
            visible: is.macos
          },
          {
            role: 'hideothers',
            visible: is.macos
          },
          {
            role: 'unhide',
            visible: is.macos
          },
          {
            type: 'separator',
            visible: is.macos
          },
          { role: 'quit' }
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'Import...',
            click: () => this.win.webContents.send ( 'import' )
          },
          {
            label: 'Export',
            enabled: keys && ( keys.hasNote || keys.isMultiEditorEditing ),
            submenu: [
              {
                label: 'HTML',
                click: () => this.win.webContents.send ( 'export-html' )
              },
              {
                label: 'Markdown',
                click: () => this.win.webContents.send ( 'export-markdown' )
              },
              {
                label: 'PDF',
                click: () => this.win.webContents.send ( 'export-pdf' )
              }
            ]
          },
          {
            type: 'separator'
          },
          {
            label: 'Open...',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.win.webContents.send ( 'quick-panel-toggle' )
          },
          {
            label: 'Open in Default App',
            accelerator: 'CmdOrCtrl+Alt+O',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-open-in-app' )
          },
          {
            label: `Reveal in ${is.macos ? 'Finder' : 'Folder'}`,
            accelerator: 'CmdOrCtrl+Alt+R',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-reveal' )
          },
          {
            type: 'separator'
          },
          {
            label: 'New',
            accelerator: 'CmdOrCtrl+N',
            enabled: keys && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-new' )
          },
          {
            label: 'New from Template',
            accelerator: 'CmdOrCtrl+Alt+Shift+N',
            enabled: keys && keys.hasNote && keys.isNoteTemplate && !keys.isMultiEditorEditing,
            visible: keys && keys.hasNote && keys.isNoteTemplate,
            click: () => this.win.webContents.send ( 'note-duplicate-template' )
          },
          {
            label: 'Duplicate',
            accelerator: 'CmdOrCtrl+Shift+N',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-duplicate' )
          },
          {
            type: 'separator'
          },
          {
            label: keys && keys.hasNote && keys.isEditorEditing ? 'Stop Editing' : 'Edit',
            accelerator: 'CmdOrCtrl+E',
            enabled: keys && keys.hasNote && !keys.isEditorSplitView && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-edit-toggle' )
          },
          {
            label: keys && keys.hasNote && keys.isTagsEditing ? 'Stop Editing Tags' : 'Edit Tags',
            accelerator: 'CmdOrCtrl+Shift+T',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-edit-tags-toggle' )
          },
          {
            label: keys && keys.hasNote && keys.isAttachmentsEditing ? 'Stop Editing Attachments' : 'Edit Attachments',
            accelerator: 'CmdOrCtrl+Shift+A',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-edit-attachments-toggle' )
          },
          {
            type: 'separator'
          },
          {
            label: keys && keys.hasNote && keys.isNoteFavorited ? 'Unfavorite' : 'Favorite',
            accelerator: 'CmdOrCtrl+D',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-favorite-toggle' )
          },
          {
            label: keys && keys.hasNote && keys.isNotePinned ? 'Unpin' : 'Pin',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-pin-toggle' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Move to Trash',
            accelerator: 'CmdOrCtrl+Backspace',
            enabled: keys && keys.hasNote && !keys.isNoteDeleted && !keys.isMultiEditorEditing,
            visible: keys && keys.hasNote && !keys.isNoteDeleted && !keys.isEditorEditing,
            click: () => this.win.webContents.send ( 'note-move-to-trash' )
          },
          {
            label: 'Move to Trash',
            accelerator: 'CmdOrCtrl+Alt+Backspace',
            enabled: keys && keys.hasNote && !keys.isNoteDeleted && !keys.isMultiEditorEditing,
            visible: keys && keys.hasNote && !keys.isNoteDeleted && keys.isEditorEditing,
            click: () => this.win.webContents.send ( 'note-move-to-trash' )
          },
          {
            label: 'Restore',
            accelerator: 'CmdOrCtrl+Shift+Backspace',
            enabled: keys && keys.hasNote && keys.isNoteDeleted && !keys.isMultiEditorEditing,
            visible: keys && keys.hasNote && keys.isNoteDeleted,
            click: () => this.win.webContents.send ( 'note-restore' )
          },
          {
            label: 'Permanently Delete',
            accelerator: 'CmdOrCtrl+Alt+Shift+Backspace',
            enabled: keys && keys.hasNote && !keys.isMultiEditorEditing,
            visible: keys && keys.hasNote,
            click: () => this.win.webContents.send ( 'note-permanently-delete' )
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' },
          {
            type: 'separator'
          },
          {
            label: 'Select Notes - All',
            accelerator: 'CmdOrCtrl+Alt+A',
            click: () => this.win.webContents.send ( 'multi-editor-select-all' )
          },
          {
            label: 'Select Notes - Invert',
            accelerator: 'CmdOrCtrl+Alt+I',
            click: () => this.win.webContents.send ( 'multi-editor-select-invert' )
          },
          {
            label: 'Select Notes - Clear',
            accelerator: 'CmdOrCtrl+Alt+C',
            click: () => this.win.webContents.send ( 'multi-editor-select-clear' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Empty Trash',
            click: () => this.win.webContents.send ( 'trash-empty' )
          },
          {
            type: 'separator',
            visible: is.macos
          },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ],
            visible: is.macos
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            role: 'reload',
            visible: Environment.isDevelopment
          },
          {
            role: 'forcereload',
            visible: Environment.isDevelopment
          },
          {
            type: 'separator',
            visible: Environment.isDevelopment
          },
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          {
            label: 'Toggle Focus Mode',
            accelerator: 'CmdOrCtrl+Alt+F',
            click: () => this.win.webContents.send ( 'window-focus-toggle' )
          },
          {
            label: 'Toggle Full Screen',
            role: 'togglefullscreen'
          },
          {
            label: 'Toggle Sidebar',
            accelerator: 'CmdOrCtrl+Alt+Shift+S',
            click: () => this.win.webContents.send ( 'window-sidebar-toggle' )
          },
          {
            label: 'Toggle Split View Mode',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => this.win.webContents.send ( 'editor-split-toggle' )
          },
          {
            label: 'Toggle Zen Mode',
            accelerator: 'CmdOrCtrl+Alt+Z',
            click: () => this.win.webContents.send ( 'window-zen-toggle' )
          }
        ]
      },
      {
        role: 'window',
        submenu: [
          { role: 'close' },
          { role: 'minimize' },
          {
            role: 'zoom',
            visible: is.macos
          },
          {
            type: 'separator'
          },
          {
            label: 'Search',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.win.webContents.send ( 'search-focus' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Previous Tag',
            accelerator: 'Control+Alt+Shift+Tab',
            click: () => this.win.webContents.send ( 'tag-previous' )
          },
          {
            label: 'Next Tag',
            accelerator: 'Control+Alt+Tab',
            click: () => this.win.webContents.send ( 'tag-next' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Previous Note',
            accelerator: 'Control+Shift+Tab',
            click: () => this.win.webContents.send ( 'search-previous' )
          },
          {
            label: 'Next Note',
            accelerator: 'Control+Tab',
            click: () => this.win.webContents.send ( 'search-next' )
          },
          { type: 'separator' },
          {
            type: 'checkbox',
            label: 'Float on Top',
            checked: !!this.win && this.win.isAlwaysOnTop (),
            click: () => this.win.setAlwaysOnTop ( !this.win.isAlwaysOnTop () )
          },
          {
            type: 'separator',
            visible: is.macos
          },
          {
            role: 'front',
            visible: is.macos
          }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: () => shell.openExternal ( pkg.homepage )
          },
          {
            label: 'Subreddit',
            click: () => shell.openExternal ( 'https://www.reddit.com/r/notable' )
          },
          {
            label: 'Support',
            click: () => shell.openExternal ( pkg.bugs.url )
          },
          {
            label: 'Tutorial',
            click: () => this.win.webContents.send ( 'tutorial-dialog' )
          },
          { type: 'separator' },
          {
            label: 'View Changelog',
            click: () => shell.openExternal ( `${pkg.homepage}/blob/master/CHANGELOG.md` )
          },
          {
            label: 'View License',
            click: () => shell.openExternal ( `${pkg.homepage}/blob/master/LICENSE` )
          },
          { type: 'separator' },
          {
            role: 'toggledevtools',
            accelerator: ''
          }
        ]
      }
    ]);

    const menu = Menu.buildFromTemplate ( template );

    Menu.setApplicationMenu ( menu );

  }

  events () {

    super.events ();

    this.___blur ();
    this.___close ();
    this.___contextKeysUpdate ();
    this.___focus ();
    this.___forceClose ();
    this.___fullscreenEnter ();
    this.___fullscreenLeave ();
    this.___navigateUrl ();
    this.___printPDF ();
    this.___mermaidOpen ();

  }

  cleanup () {

    super.cleanup ();

    ipc.removeListener ( 'context-keys-update', this.__contextKeysUpdate );
    ipc.removeListener ( 'force-close', this.__forceClose );
    ipc.removeListener ( 'print-pdf', this.__printPDF );

  }

  /* BLUR */

  ___blur = () => {

    this.win.on ( 'blur', this.__blur );

  }

  __blur = () => {

    this.win.webContents.send ( 'window-blur' );

  }


  /* CLOSE */

  ___close = () => {

    this.win.on ( 'close', this.__close );

  }

  ___close_off = () => {

    this.win.removeListener ( 'close', this.__close );

  }

  __close = ( event: Event ) => {

    if ( global.isQuitting ) return;

    event.preventDefault ();

    this.win.webContents.send ( 'window-close' );

  }

  /* CONTEXT KEYS UPDATE */

  ___contextKeysUpdate = () => {

    ipc.on ( 'context-keys-update', this.__contextKeysUpdate );

  }

  __contextKeysUpdate = ( event: Event, keys: ContextKeysObj ) => {

    this.initMenu ( keys );

  }

  /* FOCUS */

  ___focus = () => {

    this.win.on ( 'focus', this.__focus );

  }

  __focus = () => {

    this.win.webContents.send ( 'window-focus' );

  }

  /* FORCE CLOSE */

  ___forceClose = () => {

    ipc.on ( 'force-close', this.__forceClose );

  }

  __forceClose = () => {

    this.___close_off ();

    this.win.close ();

  }

  /* FULLSCREEN ENTER */

  ___fullscreenEnter = () => {

    this.win.on ( 'enter-full-screen', this.__fullscreenEnter );

  }

  __fullscreenEnter = () => {

    this.win.webContents.send ( 'window-fullscreen-set', true );

  }

  /* FULLSCREEN LEAVE */

  ___fullscreenLeave = () => {

    this.win.on ( 'leave-full-screen', this.__fullscreenLeave );

  }

  __fullscreenLeave = () => {

    this.win.webContents.send ( 'window-fullscreen-set', false );

  }

  /* NAVIGATE URL */

  ___navigateUrl = () => {

    this.win.webContents.on ( 'new-window', this.__navigateUrl );

  }

  __navigateUrl = ( event: Event, url: string ) => {

    if ( url === this.win.webContents.getURL () ) return;

    event.preventDefault ();

    shell.openExternal ( url );

  }

  /* PRINT PDF */

  ___printPDF = () => {

    ipc.on ( 'print-pdf', this.__printPDF );

  }

  __printPDF = ( event: Event, options: PrintOptions ) => {

    const win = new BrowserWindow ({
      show: false,
      webPreferences: {
        webSecurity: false
      }
    });

    if ( options.html ) {

      win.loadURL ( `data:text/html;base64,${Buffer.from ( options.html ).toString ( 'base64' )}` ); //FIXME: https://github.com/electron/electron/issues/18093

    } else if ( options.src ) {

      win.loadFile ( options.src );

    } else {

      return console.error ( 'No content or file to print to PDF provided' );

    }

    const optionsPDF = {
      printBackground: true
    };

    win.webContents.on ( 'did-finish-load', () => {
      win.webContents.printToPDF ( optionsPDF, ( err, data ) => {
        if ( err ) return console.error ( err );
        fs.writeFile ( options.dst, data, err => {
          if ( err ) {
            if ( err.code === 'ENOENT' ) {
              mkdirp ( path.dirname ( options.dst ), ( err: Error ) => {
                if ( err ) return console.error ( err );
                fs.writeFile ( options.dst, data, err => {
                  if ( err ) return console.error ( err );
                });
              });
            } else {
              return console.error ( err );
            }
          }
        });
      });
    });

  }

  /* MERMAID OPEN */

  ___mermaidOpen = () => {

    ipc.on ( 'mermaid-open', this.__mermaidOpen );

  }

  __mermaidOpen = ( event: Event, data: string ) => {

    new Mermaid ( undefined, undefined, undefined, data ).init ();

  }

  /* UPDATER */

  _updaterCanCheck = () => {

    return ( Date.now () - this._prevUpdateCheckTimestamp ) >= 2000;

  }

  _updaterCheck = () => {

    this._prevUpdateCheckTimestamp = Date.now ();

    this.initMenu ();

    ipc.emit ( 'updater-check', true );

    setTimeout ( this.initMenu.bind ( this ), 2000 );

  }

  /* LOAD */

  load () {

    super.load ();

    setTimeout ( this.__didFinishLoad, 500 ); //TODO: Ideally the timeout should be 0, for for that we need to minimize the amount of work happening before the skeleton can be rendered

  }

}

/* EXPORT */

export default Main;
