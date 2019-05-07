
/* IMPORT */

import critically from 'critically';
import {Container} from 'overstated';

/* SKELETON */

class Skeleton extends Container<SkeletonState, MainCTX> {

  /* API */

  get = async (): Promise<string> => {

    function transform ( doc: Document ) {
      const $html = $(doc.documentElement);
      $html.find ( 'body > :not(.app)' ).remove ();
      $html.find ( '.app' ).children ().not ( '.main' ).remove ();
      $html.find ( '.main' ).children ().not ( '.sidebar, .middlebar, .mainbar' ).remove ();
      $html.find ( '.sidebar' ).children ().remove ();
      $html.find ( '.layout-header, .layout-content' ).children ().remove ();
      $html.find ( '.mainbar' ).children ().not ( '.layout-header, .layout-content' ).remove ();
      $html.find ( '.editor, .preview' ).remove ();
      $html.find ( '*' ).removeAttr ( 'style' );
      $html.find ( '*' ).removeClass ( 'centerer xsmall resizable' );
      $html.find ( 'head' ).children ().not ( 'meta[charset], style:not([data-critical]), link[rel="stylesheet"]' ).remove ();
      $html.find ( 'html' ).removeAttr ( 'class' );
      $html.find ( '.tree, .list, .list-notes' ).removeClass ( 'tree list list-notes' );
    }

    const {html} = await critically ({ document, transform });

    return html;

  }

  getToClipboard = async (): Promise<void> => {

    const skeleton = await this.get ();

    this.ctx.clipboard.set ( skeleton );

    console.log ( 'Skeleton copied to the clipboard!' );

  }

}

/* EXPORT */

export default Skeleton;
