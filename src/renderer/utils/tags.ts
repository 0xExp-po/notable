
/* IMPORT */

import * as _ from 'lodash';

/* ENUMS */

enum TagSpecials {
  DEFAULT = '__ALL__',
  ALL = '__ALL__',
  FAVORITES = '__FAVORITES__',
  NOTEBOOKS = 'Notebooks',
  TAGS = '__TAGS__',
  TEMPLATES = 'Templates',
  UNTAGGED = '__UNTAGGED__',
  TRASH = '__TRASH__'
};

enum TagSpecialsNames {
  ALL = 'All Notes',
  FAVORITES = 'Favorites',
  NOTEBOOKS = 'Notebooks',
  TAGS = 'Tags',
  TEMPLATES = 'Templates',
  UNTAGGED = 'Untagged',
  TRASH = 'Trash'
};

/* TAGS */

const Tags = {

  SEPARATOR: '/', // Used for nested tags: `Parent/Child`

  isPrivate ( tag: TagObj | string ): boolean {

    return /^__.*__$/.test ( _.isString ( tag ) ? tag : tag.name );

  },

  sort ( tags: (TagObj | string)[] ) {

    return _.sortBy ( tags, tag => ( _.isString ( tag ) ? tag : tag.name ).toLowerCase () );

  }

};

/* EXPORT */

export default Tags;
export {TagSpecials, TagSpecialsNames};
