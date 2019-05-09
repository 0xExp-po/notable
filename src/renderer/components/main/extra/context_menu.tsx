
/* IMPORT */

import * as _ from 'lodash';
import {MenuItem, MenuItemConstructorOptions} from 'electron';
import contextMenu from 'electron-context-menu';
import Dialog from 'electron-dialog';
import * as is from 'electron-is';
import {connect} from 'overstated';
import {Component} from 'react-component-renderless';
import Main from '@renderer/containers/main';
import {TagSpecials} from '@renderer/utils/tags';
import {clipboard} from 'electron';

/* CONTEXT MENU */

class ContextMenu extends Component<{ container: IMain }, {}> {

  /* VARIABLES */

  ele; attachment; note; tag; // Globals pointing to the current element/attachment/note/tag object

  /* SPECIAL */

  componentDidMount () {

    this.initAttachmentMenu ();
    this.initEditorMenu ();
    this.initNoteMenu ();
    this.initNoteTagMenu ();
    this.initTagMenu ();
    this.initTrashMenu ();
    this.initFallbackMenu ();

  }

  /* HELPERS */

  _getItem = ( x, y, selector ) => {

    const eles = document.elementsFromPoint ( x, y );

    return $(eles).filter ( selector )[0];

  }

  _makeMenu = ( selector: string | Function = '*', items: MenuItemConstructorOptions[] = [], itemsUpdater = _.noop ) => {

    contextMenu ({
      prepend: () => items as MenuItem[], //TSC: Looks like a bug in `electron-context-menu`?
      shouldShowMenu: ( event, { x, y } ) => {

        const ele = _.isString ( selector ) ? this._getItem ( x, y, selector ) : selector ( x, y );

        if ( !ele ) return false;

        this.ele = ele;

        itemsUpdater ( items );

        return true;

      }
    });

  }

  /* INIT */

  initAttachmentMenu = () => {

    this._makeMenu ( '.attachment', [
      {
        label: 'Open',
        click: () => this.props.container.attachment.openInApp ( this.attachment )
      },
      {
        label: `Reveal in ${is.macOS () ? 'Finder' : 'Folder'}`,
        click: () => this.props.container.attachment.reveal ( this.attachment )
      },
      {
        type: 'separator'
      },
      {
        label: 'Copy',
        click: () => clipboard.writeText ( this.attachment.fileName )
      },
      {
        label: 'Rename',
        click: () => Dialog.alert ( 'Simply rename the actual attachment file while Notable is open' )
      },
      {
        label: 'Delete',
        click: () => this.props.container.note.removeAttachment ( undefined, this.attachment )
      }
    ], this.updateAttachmentMenu );

  }

  initEditorMenu = () => {

    this._makeMenu ( '.monaco-editor', [
      {
        label: 'Cut',
        click: this.props.container.editor.cut
      },
      {
        label: 'Copy',
        click: this.props.container.editor.copy
      },
      {
        label: 'Paste',
        click: this.props.container.editor.paste
      }
    ], this.updateEditorMenu );

  }

  initNoteMenu = () => {

    this._makeMenu ( '.note', [
      {
        label: 'Open in Default App',
        click: () => this.props.container.note.openInApp ( this.note )
      },
      {
        label: `Reveal in ${is.macOS () ? 'Finder' : 'Folder'}`,
        click: () => this.props.container.note.reveal ( this.note )
      },
      {
        type: 'separator'
      },
      {
        label: 'New from Template',
        click: () => this.props.container.note.duplicate ( this.note, true )
      },
      {
        label: 'Duplicate',
        click: () => this.props.container.note.duplicate ( this.note )
      },
      {
        label: 'Copy',
        click: () => clipboard.writeText ( this.note.metadata.title )
      },
      {
        type: 'separator'
      },
      {
        label: 'Favorite',
        click: () => this.props.container.note.toggleFavorite ( this.note, true )
      },
      {
        label: 'Unfavorite',
        click: () => this.props.container.note.toggleFavorite ( this.note, false )
      },
      {
        type: 'separator'
      },
      {
        label: 'Move to Trash',
        click: () => this.props.container.note.toggleDeleted ( this.note, true )
      },
      {
        label: 'Restore',
        click: () => this.props.container.note.toggleDeleted ( this.note, false )
      },
      {
        label: 'Permanently Delete',
        click: () => this.props.container.note.delete ( this.note )
      }
    ], this.updateNoteMenu );

  }

  initNoteTagMenu = () => {

    this._makeMenu ( '.tag:not([data-has-children]):not(a)', [
      {
        label: 'Remove',
        click: () => this.props.container.note.removeTag ( undefined, $(this.ele).attr ( 'data-tag' ) )
      },
      {
        label: 'Copy',
        click: () => clipboard.writeText (  $(this.ele).attr ( 'data-tag' ) )
      }
    ]);

  }

  initTagMenu = () => {

    this._makeMenu ( '.tag[data-has-children="true"], .tag[data-collapsed="true"]', [
      {
        label: 'Collapse',
        click: () => this.props.container.tag.toggleCollapse ( this.tag, true )
      },
      {
        label: 'Expand',
        click: () => this.props.container.tag.toggleCollapse ( this.tag, false )
      },
      {
        type: 'separator'
      },
      {
        label: 'Copy',
        click: () => clipboard.writeText ( this.tag )
      },
    ], this.updateTagMenu );

  }

  initTrashMenu = () => {

    this._makeMenu ( '.tag[data-tag="__TRASH__"]', [
      {
        label: 'Empty Trash',
        click: this.props.container.trash.empty
      }
    ], this.updateTrashMenu );

  }

  initFallbackMenu = () => {

    this._makeMenu ( ( x, y ) => !this._getItem ( x, y, '.attachment, .monaco-editor, .note, .tag:not([data-has-children]), .tag[data-has-children="true"], .tag[data-collapsed="true"], .tag[data-tag="__TRASH__"]' ) );

  }

  /* UPDATE */

  updateAttachmentMenu = ( items: MenuItem[] ) => {

    const fileName = $(this.ele).data ( 'filename' );

    this.attachment = this.props.container.attachment.get ( fileName );

  }

  updateEditorMenu = ( items: MenuItem[] ) => {

    const canCopy = !!this.props.container.editor._getSelectedText (),
          canPaste = !!this.props.container.clipboard.get ();

    items[0].visible = canCopy;
    items[1].visible = canCopy;
    items[2].visible = canPaste;

  }

  updateNoteMenu = ( items: MenuItem[] ) => {

    const filePath = $(this.ele).data ( 'filepath' );

    this.note = this.props.container.note.get ( filePath );

    const isFavorited = this.props.container.note.isFavorited ( this.note ),
          isDeleted = this.props.container.note.isDeleted ( this.note ),
          isTemplate = !!this.props.container.note.getTags ( this.note, TagSpecials.TEMPLATES ).length;

    items[3].visible = !!isTemplate;
    items[6].visible = !isFavorited;
    items[7].visible = !!isFavorited;
    items[9].visible = !isDeleted;
    items[10].visible = !!isDeleted;

  }

  updateTagMenu = ( items: MenuItem[] ) => {

    this.tag = $(this.ele).attr ( 'data-tag' );

    const isCollapsed = this.props.container.tag.isCollapsed ( this.tag );

    items[0].visible = !isCollapsed;
    items[1].visible = isCollapsed;

  }

  updateTrashMenu = ( items: MenuItem[] ) => {

    items[0].enabled = !this.props.container.trash.isEmpty ();

  }

}

/* EXPORT */

export default connect ({
  container: Main,
  shouldComponentUpdate: false
})( ContextMenu );
