
/* IMPORT */

import * as _ from 'lodash';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import {Command, EditorCommand} from 'monaco-editor/esm/vs/editor/browser/editorExtensions.js';
import {EditorContextKeys} from 'monaco-editor/esm/vs/editor/common/editorContextKeys.js';
import * as LanguageMarkdown from 'monaco-editor/esm/vs/basic-languages/markdown/markdown.js';
import * as path from 'path';
import Settings from '@common/settings';
import ThemeLight from './monaco_light';
import ThemeDark from './monaco_dark';
import Todo from './monaco_todo';

/* MONACO */

const Monaco = {

  editorOptions: {
    accessibilitySupport: 'off',
    colorDecorators: false,
    contextmenu: false,
    copyWithSyntaxHighlighting: false,
    disableLayerHinting: true,
    dragAndDrop: true,
    folding: false,
    fontSize: 16 * .875,
    hideCursorInOverviewRuler: true,
    highlightActiveIndentGuide: false,
    hover: {
      enabled: false
    },
    iconsInSuggestions: false,
    lightbulb: {
      enabled: false
    },
    lineDecorationsWidth: 19, // It gives a bit of a padding to the left
    lineHeight: 16 * .875 * 1.5,
    lineNumbers: Settings.get ( 'monaco.editorOptions.lineNumbers' ),
    minimap: {
      enabled: Settings.get ( 'monaco.editorOptions.minimap.enabled' )
    },
    model: null,
    occurrencesHighlight: false,
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    renderIndentGuides: false,
    roundedSelection: false,
    scrollbar: {
      useShadows: false,
      horizontalScrollbarSize: 12,
      verticalScrollbarSize: 12
    },
    scrollBeyondLastColumn: 0,
    scrollBeyondLastLine: false,
    snippetSuggestions: 'none',
    wordWrap: Settings.get ( 'monaco.editorOptions.wordWrap' ),
    wordWrapColumn: 1000000,
    wordWrapMinified: false,
    wrappingIndent: 'same'
  } as monaco.editor.IEditorOptions,

  modelOptions: {
    insertSpaces: true,
    tabSize: 2,
    trimAutoWhitespace: true
  } as monaco.editor.ITextModelUpdateOptions,

  keybindings: {

    'cursorTop': {
      options: {
        kbOpts: {
          kbExpr: EditorContextKeys.editorTextFocus,
          primary: monaco.KeyMod.CtrlCmd | monaco.KeyCode.Home,
          mac: { primary: monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow },
          weight: 0
        }
      },
      handler ( accessor, editor: MonacoEditor ) {
        const position0 = {
          lineNumber: 0,
          column: 0
        };
        editor.restoreViewState ({
          contributionsState: {},
          cursorState: [{
            inSelectionMode: false,
            selectionStart: position0,
            position: position0
          }],
          viewState: {
            scrollLeft: 0,
            firstPosition: position0,
            firstPositionDeltaTop: Infinity // Ensuring we are scrolling to the very top, important in zen mode
          }
        });
      }
    },

    'editor.toggleLineNumbers': {
      options: {
        kbOpts: {
          kbExpr: EditorContextKeys.editorTextFocus,
          primary: monaco.KeyMod.Alt | monaco.KeyCode.KEY_L,
          weight: 100
        }
      },
      handler ( accessor, editor: MonacoEditor ) {

        Monaco.editorOptions.lineNumbers = ( Monaco.editorOptions.lineNumbers === 'off' ) ? 'on' : 'off';

        Settings.set ( 'monaco.editorOptions.lineNumbers', Monaco.editorOptions.lineNumbers );

        editor.updateOptions ( Monaco.editorOptions );

      }
    },

    'editor.toggleMinimap': {
      options: {
        kbOpts: {
          kbExpr: EditorContextKeys.editorTextFocus,
          primary: monaco.KeyMod.Alt | monaco.KeyCode.KEY_M,
          weight: 100
        }
      },
      handler ( accessor, editor: MonacoEditor ) {

        if ( !Monaco.editorOptions.minimap ) Monaco.editorOptions.minimap = {};

        Monaco.editorOptions.minimap.enabled = !Monaco.editorOptions.minimap.enabled;

        Settings.set ( 'monaco.editorOptions.minimap.enabled', Monaco.editorOptions.minimap.enabled );

        editor.updateOptions ( Monaco.editorOptions );

      }
    },

    'editor.toggleWordWrap': {
      options: {
        precondition: EditorContextKeys.writable,
        kbOpts: {
          kbExpr: EditorContextKeys.editorTextFocus,
          primary: monaco.KeyMod.Alt | monaco.KeyCode.KEY_Z,
          weight: 100
        }
      },
      handler ( accessor, editor: MonacoEditor ) {

        Monaco.editorOptions.wordWrap = Monaco.editorOptions.wordWrap === 'bounded' ? 'off' : 'bounded';

        Settings.set ( 'monaco.editorOptions.wordWrap', Monaco.editorOptions.wordWrap );

        editor.updateOptions ( Monaco.editorOptions );

      }
    },

    'editor.toggleTodo': {
      options: {
        precondition: EditorContextKeys.writable,
        kbOpts: {
          kbExpr: EditorContextKeys.editorTextFocus,
          primary: monaco.KeyMod.Alt | monaco.KeyCode.Enter,
          weight: 100
        }
      },
      handler ( accessor, editor: MonacoEditor ) {
        Todo.toggleTodo ( editor );
      }
    },

    'editor.toggleTodoDone': {
      options: {
        precondition: EditorContextKeys.writable,
        kbOpts: {
          kbExpr: EditorContextKeys.editorTextFocus,
          primary: monaco.KeyMod.Alt | monaco.KeyCode.KEY_D,
          weight: 100
        }
      },
      handler ( accessor, editor: MonacoEditor ) {
        Todo.toggleTodoDone ( editor );
      }
    }

  } as { [command: string]: { options: any, handler: Function } | undefined },

  keybindingsPatched: {

    'actions.find': false,
    'actions.findWithSelection': false,
    'cancelSelection': false,
    'closeFindWidget': false,
    'cursorColumnSelectDown': false,
    'cursorColumnSelectLeft': false,
    'cursorColumnSelectPageDown': false,
    'cursorColumnSelectPageUp': false,
    'cursorColumnSelectRight': false,
    'cursorColumnSelectUp': false,
    'editor.action.changeAll': false,
    'editor.action.copyLinesDownAction': false,
    'editor.action.copyLinesUpAction': false,
    'editor.action.deleteLines': false,
    'editor.action.diffReview.next': false,
    'editor.action.diffReview.prev': false,
    'editor.action.indentLines': false,
    'editor.action.insertCursorAtEndOfEachLineSelected': false,
    'editor.action.joinLines': false,
    'editor.action.moveSelectionToNextFindMatch': false,
    'editor.action.nextMatchFindAction': false,
    'editor.action.nextSelectionMatchFindAction': false,
    'editor.action.outdentLines': false,
    'editor.action.previousMatchFindAction': false,
    'editor.action.previousSelectionMatchFindAction': false,
    'editor.action.replaceAll': false,
    'editor.action.replaceOne': false,
    'editor.action.selectAllMatches': false,
    'editor.action.startFindReplaceAction': false,
    'editor.action.trimTrailingWhitespace': false,
    'expandLineSelection': false,
    'lineBreakInsert': false,
    'removeSecondaryCursors': false,
    'scrollLineDown': false,
    'scrollLineUp': false,
    'scrollPageDown': false,
    'scrollPageUp': false,
    'toggleFindCaseSensitive': false,
    'toggleFindInSelection': false,
    'toggleFindRegex': false,
    'toggleFindWholeWord': false,

    'editor.action.moveLinesDownAction': cmd => {
      cmd._kbOpts.primary = cmd._kbOpts.linux.primary = monaco.KeyMod.WinCtrl | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow;
      cmd._kbOpts.mac = {};
      cmd._kbOpts.mac.primary = monaco.KeyMod.CtrlCmd | monaco.KeyMod.WinCtrl | monaco.KeyCode.DownArrow;
    },

    'editor.action.moveLinesUpAction': cmd => {
      cmd._kbOpts.primary = cmd._kbOpts.linux.primary = monaco.KeyMod.WinCtrl | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow;
      cmd._kbOpts.mac = {};
      cmd._kbOpts.mac.primary = monaco.KeyMod.CtrlCmd | monaco.KeyMod.WinCtrl | monaco.KeyCode.UpArrow;
    }

  } as { [command: string]: Function | false | undefined },

  themes: {

    light: ThemeLight,
    dark: ThemeDark

  } as { [name: string]: monaco.editor.IStandaloneThemeData },

  init: _.once ( () => {

    Monaco.initEnvironment ();
    Monaco.initThemes ();
    Monaco.initTokenizers ();

  }),

  initEnvironment () {

    self['MonacoEnvironment'] = {
      getWorkerUrl () {
        return `file://${path.join ( __static, 'javascript', 'monaco.worker.js' )}`;
      }
    };

  },

  initKeybindings () {

    Object.keys ( Monaco.keybindings ).forEach ( id => {

      const keybinding = Monaco.keybindings[id];

      if ( !keybinding ) return;

      const {options, handler} = keybinding;

      options.id = id;
      options.label = options.label || options.id;

      class CustomCommand extends EditorCommand {

        constructor () {
          super ( options );
        }

        runEditorCommand ( accessor, editor: MonacoEditor ) {
          return handler ( accessor, editor );
        }

      }

      new CustomCommand ()['register']();

    });

  },

  initThemes () {

    Object.keys ( Monaco.themes ).forEach ( name => {

      monaco.editor.defineTheme ( name, Monaco.themes[name] );

    });

  },

  initTokenizers () {

    LanguageMarkdown.language.tokenizer.root.shift ();
    LanguageMarkdown.language.tokenizer.root.unshift (
      [/^(\s{0,3})(#+)((?:[^\\#]|@escapes)+)((?:#+)?)/, ['white', 'keyword.title', 'title', 'keyword.title']],
    );

  },

  patchKeybindings () {

    const _register = Command.prototype.register;

    Command.prototype.register = function () {
      const patcher = Monaco.keybindingsPatched[this.id];
      if ( patcher === false || ( patcher && patcher ( this ) === false ) ) return; // Disabled
      return _register.apply ( this, arguments );
    };

  }

};

Monaco.patchKeybindings ();
Monaco.initKeybindings ();

/* EXPORT */

export default Monaco;
