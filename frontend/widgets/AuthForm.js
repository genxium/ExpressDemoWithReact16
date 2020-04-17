'use-strict';

const React = require('react');
const Component = React.Component;

import { View, Input, getRootElementSize, } from './WebCommonRouteProps';

import { Form, } from 'react-bootstrap';

class AuthForm extends Component {

  render() {
    const sceneRef = this;
    const {disabled, hideHandleInput, hidePasswordInput, hideDisplayNameInput, sharedInputStyle, handleValue, handleInputHint, handleInputPlaceholder, onHandleInputUpdated, passwordValue, passwordInputHint, passwordInputPlaceholder, onPasswordInputUpdated, displayNameValue, displayNameInputHint, displayNameInputPlaceholder, onDisplayNameInputUpdated, ...other} = sceneRef.props;

    let inputList = [];
    let localKey = 0;

    if (true != hideHandleInput) {
      const handleInput = (
      <Form.Group key={ localKey++ }>
        <Form.Control
                      disabled={ disabled }
                      style={ sharedInputStyle }
                      type="text"
                      value={ handleValue }
                      onChange={ onHandleInputUpdated }
                      placeholder={ handleInputPlaceholder } />
      </Form.Group>
      );
      inputList.push(handleInput);
    }

    if (true != hidePasswordInput) {
      const passwordInput = (
      <Form.Group key={ localKey++ }>
        <Form.Control
                      disabled={ disabled }
                      style={ sharedInputStyle }
                      type="password"
                      value={ passwordValue }
                      onChange={ onPasswordInputUpdated }
                      placeholder={ passwordInputPlaceholder } />
      </Form.Group>
      );
      inputList.push(passwordInput);
    }

    if (true != hideDisplayNameInput) {
      const displayNameInput = (
      <Form.Group key={ localKey++ }>
        <Form.Control
                      disabled={ disabled }
                      style={ sharedInputStyle }
                      type="text"
                      value={ displayNameValue }
                      onChange={ onDisplayNameInputUpdated }
                      placeholder={ displayNameInputPlaceholder } />
      </Form.Group>
      );
      inputList.push(displayNameInput);
    }

    const form = (
    <Form>
      { inputList }
      { sceneRef.props.children }
    </Form>
    );

    return form;
  }
}

export default AuthForm;
