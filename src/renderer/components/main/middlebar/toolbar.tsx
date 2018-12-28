
/* IMPORT */

import * as React from 'react';
import Search from './toolbar_search';
import NewButton from './toolbar_button_new';

/* TOOLBAR */

const Toolbar = () => (
  <div id="middlebar-toolbar" className="layout-header centerer">
    <div className="multiple grow">
      <Search />
      <NewButton />
    </div>
  </div>
);

/* EXPORT */

export default Toolbar;
