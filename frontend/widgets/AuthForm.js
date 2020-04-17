'use-strict';

const React = require('react');
const Component = React.Component;

import { View, Input, getRootElementSize, } from './WebCommonRouteProps';

class AuthForm extends Component {

  render() {
    const sceneRef = this;
    const {disabled, sharedInputStyle, handleValue, handleInputHint, handleInputPlaceholder, onHandleInputUpdated, passwordValue, passwordInputHint, passwordInputPlaceholder, onPasswordInputUpdated, displayNameValue, displayNameInputHint, displayNameInputPlaceholder, onDisplayNameInputUpdated, ...other} = sceneRef.props;

    const handleInput = (
    <View>
      <Input
             disabled={ disabled }
             style={ sharedInputStyle }
             type="text"
             value={ handleValue }
             onUpdated={ onHandleInputUpdated }
             placeholder={ handleInputPlaceholder } />
    </View>
    );

    const passwordInput = (
    <View>
      <Input
             disabled={ disabled }
             style={ sharedInputStyle }
             type="password"
             value={ passwordValue }
             onUpdated={ onPasswordInputUpdated }
             placeholder={ passwordInputPlaceholder } />
    </View>
    );

    const displayNameInput = (
    <View>
      <Input
             disabled={ disabled }
             style={ sharedInputStyle }
             type="text"
             value={ displayNameValue }
             onUpdated={ onDisplayNameInputUpdated }
             placeholder={ displayNameInputPlaceholder } />
    </View>
    );

    const form = (
    <View>
      { handleInput }
      { passwordInput }
      { displayNameInput }
      { sceneRef.props.children }
    </View>
    );

    return form;
  }
}

export default AuthForm;
