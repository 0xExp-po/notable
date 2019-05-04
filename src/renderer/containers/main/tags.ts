
/* IMPORT */

import * as _ from 'lodash';
import {Container, autosuspend} from 'overstated';
import UTags, {TagSpecials, TagSpecialsNames} from '@renderer/utils/tags';

const {SEPARATOR} = UTags;
const {ALL, FAVORITES, NOTEBOOKS, TAGS, TEMPLATES, UNTAGGED, TRASH} = TagSpecials;

/* TAGS */

class Tags extends Container<TagsState, MainCTX> {

  /* STATE */

  state = {
    tags: {},
    editing: false
  };

  /* CONSTRUCTOR */

  constructor () {

    super ();

    autosuspend ( this );

  }

  /* HELPERS */

  _toggleNote = ( tags: TagsObj, note: NoteObj, add: boolean, clone: boolean = false ) => {

    function toggle ( parent: TagsObj, key: string, deletable: boolean = false ) {
      const tag: TagObj = parent[key];
      const index = tag.notes.findIndex ( n => n.checksum === note.checksum && n.filePath === note.filePath ); //FIXME: This should actually be `tag.notes.indexOf ( note )` but for some reason some times it doesn't work
      if ( add ) {
        if ( index === -1 ) {
          tag.notes.push ( note );
        }
      } else if ( index >= 0 ) {
        tag.notes.splice ( index, 1 );
      }
      if ( !tag.notes.length && deletable ) {
        delete parent[key];
      } else if ( clone ) {
        parent[key] = _.clone ( tag );
      }
    }

    if ( this.ctx.note.isDeleted ( note ) ) {

      toggle ( tags, TRASH );

    } else {

      const tagsAll = this.ctx.note.getTags ( note ),
            tagsNotebooks = this.ctx.note.getTags ( note, NOTEBOOKS ),
            isNotebook = !!tagsNotebooks.length,
            tagsTemplates = this.ctx.note.getTags ( note, TEMPLATES ),
            isTemplate = !!tagsTemplates.length;

      if ( !isTemplate ) {

        toggle ( tags, ALL );

      }

      if ( this.ctx.note.isFavorited ( note ) ) {

        toggle ( tags, FAVORITES );

      }

      if ( !tagsAll.length ) {

        toggle ( tags, UNTAGGED );

      } else {

        tagsAll.forEach ( tag => {

          const isNotebookTag = isNotebook && tagsNotebooks.includes ( tag ),
                isTemplateTag = isTemplate && tagsTemplates.includes ( tag );

          if ( isTemplate && !isTemplateTag ) return;

          const parts = tag.split ( SEPARATOR ),
                currentParts: string[] = [];

          parts.reduce ( ( tags: TagsObj | undefined, tag: string, index: number ) => {

            if ( !tags ) return;

            currentParts.push ( tag );

            if ( !tags[tag] ) {

              if ( !add ) return;

              const path = currentParts.join ( SEPARATOR ),
                    collapsed = this.ctx.tag.isCollapsed ( path )

              tags[tag] = { path, name: tag, collapsed, notes: [], tags: {} };

            }

            const isSpecial = !index && ( tag === NOTEBOOKS || tag === TEMPLATES );

            toggle ( tags, tag, !isSpecial );

            if ( !index && !isNotebookTag && !isTemplateTag ) {

              if ( tags[tag] ) {

                tags[TAGS].tags[tag] = tags[tag];

              } else {

                delete tags[TAGS].tags[tag];

              }

              toggle ( tags, TAGS );

            }

            return tags[tag] && tags[tag].tags;

          }, tags );

        });

      }

    }

    return tags;

  }

  /* LIFECYCLE */

  refresh = () => {

    let tags: TagsObj = {};

    tags[ALL] = { icon: 'note', collapsed: false, path: ALL, name: TagSpecialsNames.ALL, notes: [], tags: {} };
    tags[FAVORITES] = { icon: 'star', collapsed: false, path: FAVORITES, name: TagSpecialsNames.FAVORITES, notes: [], tags: {} };
    tags[NOTEBOOKS] = { icon: 'notebook', iconCollapsed: 'notebook_multiple', collapsed: false, path: NOTEBOOKS, name: TagSpecialsNames.NOTEBOOKS, notes: [], tags: {} };
    tags[TAGS] = { collapsed: false, path: TAGS, name: TagSpecialsNames.TAGS, notes: [], tags: {} };
    tags[TEMPLATES] = { icon: 'tag_outline', iconCollapsed: 'tag_outline_multiple', collapsed: false, path: TEMPLATES, name: TagSpecialsNames.TEMPLATES, notes: [], tags: {} };
    tags[UNTAGGED] = { icon: 'tag_crossed', collapsed: false, path: UNTAGGED, name: TagSpecialsNames.UNTAGGED, notes: [], tags: {} };
    tags[TRASH] = { icon: 'delete', collapsed: false, path: TRASH, name: TagSpecialsNames.TRASH, notes: [], tags: {} };

    Object.values ( this.ctx.notes.get () ).forEach ( note => this._toggleNote ( tags, note, true ) );

    return this.set ( tags );

  }

  /* API */

  get = (): TagsObj => {

    return this.state.tags;

  }

  set = ( tags: TagsObj ) => {

    return this.setState ({ tags });

  }

  isEditing = (): boolean => {

    return this.state.editing;

  }

  toggleEditing = ( editing: boolean = !this.state.editing ) => {

    return this.setState ({ editing });

  }

  update = ( updates: { add?: NoteObj[], remove?: NoteObj[] } ) => {

    if ( _.isEmpty ( updates.add ) && _.isEmpty ( updates.remove ) ) return;

    const tags = this.get ();

    if ( updates.remove ) {

      updates.remove.forEach ( note => {

        this._toggleNote ( tags, note, false, true );

      });

    }

    if ( updates.add ) {

      updates.add.forEach ( note => {

        this._toggleNote ( tags, note, true, true );

      });

    }

    return this.set ( tags );

  }

}

/* EXPORT */

export default Tags;
