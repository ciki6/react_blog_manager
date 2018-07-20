import React, {Component} from 'react';
// Require Editor JS files.
import 'froala-editor/js/froala_editor.pkgd.min.js';

// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// Require Font Awesome.
import 'font-awesome/css/font-awesome.css';

import FroalaEditor from 'react-froala-wysiwyg';

import './style.scss';

export default class MyEditor extends Component {

  constructor(props){
    super(props);
    this.state = {
      model: 'example text'
    }
    this.config = {
      placeholderText: 'Edit Your Content Here!',
      charCounterCount: false
    }
  }


	  render() {

		return (
		  <FroalaEditor
  tag='textarea'
  config={this.config}
  model={this.state.model}
/>
		);
	  }
	}