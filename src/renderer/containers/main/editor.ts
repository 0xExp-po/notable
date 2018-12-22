
/* IMPORT */

import {Container} from 'overstated';
import Utils from '@renderer/utils/utils';

/* EDITOR */

class Editor extends Container<EditorState, MainCTX> {

  /* STATE */

  state = {
    editing: false
  };

  /* VIEW STATE */

  editingState = {

    state: undefined as EditorEditingState,

    get: () => {

      const cm = this.getCodeMirror (),
            note = this.ctx.note.get ();

      if ( !cm || !note ) return;

      return {
        filePath: note.filePath,
        scrollTop: $('.CodeMirror-scroll')[0].scrollTop,
        selections: cm.listSelections ()
      };

    },

    set: async ( state ) => {

      const $scroll = await Utils.qsaWait ( '.CodeMirror-scroll' );

      if ( !$scroll ) return;

      $scroll[0].scrollTop = state.scrollTop;

      const cm = this.getCodeMirror ();

      if ( !cm ) return;

      cm.setSelections ( state.selections );

    },

    save: () => {

      this.editingState.state = this.editingState.get ();

    },

    restore: () => {

      const note = this.ctx.note.get ();

      if ( !note || !this.editingState.state || note.filePath !== this.editingState.state.filePath ) return;

      this.editingState.set ( this.editingState.state );

    },

    reset: () => {

      this.editingState.set ({
        scrollTop: 0,
        selections: []
      });

    }

  }

  previewingState = {

    state: undefined as EditorPreviewingState,

    get: () => {

      const $preview = $('.editor.preview'),
            note = this.ctx.note.get ();

      if ( !$preview.length || !note ) return;

      return {
        filePath: note.filePath,
        scrollTop: $preview[0].scrollTop
      };

    },

    set: async ( state ) => {

      const $preview = await Utils.qsaWait ( '.editor.preview' );

      if ( !$preview ) return;

      $preview[0].scrollTop = state.scrollTop;

    },

    save: () => {

      this.previewingState.state = this.previewingState.get ();

    },

    restore: () => {

      const note = this.ctx.note.get ();

      if ( !note || !this.previewingState.state || note.filePath !== this.previewingState.state.filePath ) return;

      this.previewingState.set ( this.previewingState.state );

    },

    reset: () => {

      this.previewingState.set ({
        scrollTop: 0
      });

    }

  }

  /* API */

  isEditing = (): boolean => {

    return this.state.editing;

  }

  toggleEditing = ( editing: boolean = !this.state.editing ) => {

    if ( editing ) {

      this.previewingState.save ();
      this.editingState.restore ();

    } else {

      this.editingState.save ();
      this.previewingState.restore ();

    }

    return this.setState ({ editing });

  }

  getCodeMirror = () => { // Getting the instance in a reliable way

    const ele = $('.CodeMirror')[0];

    return ele && ele.CodeMirror;

  }

}

/* EXPORT */

export default Editor;
