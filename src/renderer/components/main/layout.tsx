
/* IMPORT */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Utils from '@renderer/utils/utils';

/* LAYOUT */

class Layout extends React.Component<{ resizable: boolean, direction: string, className?: string, isFocus?: boolean, isZen?: boolean, hasSidebar?: boolean }, {}> {

  $layout;
  dimensions?: number[];

  update = async () => {

    const {resizable} = this.props;

    if ( !resizable ) return;

    const $children = await Utils.qsaWait ( `:scope > .layout, :scope > .layout-content`, this.$layout );

    if ( !$children || !$children.length ) return;

    if ( $children.length === 1 ) { // Saving state

      this.dimensions = this.$layout.layoutResizable ( 'getDimensions' );

      this.$layout.layoutResizable ( 'destroy' );

    } else { // Resetting

      this.$layout.layoutResizable ( 'destroy' ).layoutResizable ();

      if ( this.dimensions ) { // Restoring state

        this.$layout.layoutResizable ( 'setDimensions', this.dimensions );

      }

    }

  }

  __resize = ( event: Event ) => {

    if ( event.target === this.$layout[0] ) return;

    this.$layout.layoutResizable ( 'instance' ).__resize ();

  }

  componentDidMount () {

    this.$layout = $(ReactDOM.findDOMNode ( this ));

    $('.layout.resizable').not ( this.$layout ).on ( 'layoutresizable:resize', this.__resize );

    this.update ();

  }

  componentDidUpdate () {

    this.update ();

  }

  componentWillUnmount () {

    this.$layout.layoutResizable ( 'destroy' );

    $('.layout.resizable').not ( this.$layout ).off ( 'layoutresizable:resize', this.__resize );

  }

  render () {

    const {className, direction, resizable, children} = this.props;

    return <div className={`layout ${direction} ${resizable ? 'resizable' : ''} ${className || ''}`}>{children}</div>;

  }

}

/* DEFAULT */

export default Layout;
