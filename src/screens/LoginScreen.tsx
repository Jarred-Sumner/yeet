import { Formik } from "formik";
import * as React from "react";
import { Mutation } from "react-apollo";
import {
  InteractionManager,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Yup from "yup";
import { FormField } from "../components/FormField";
import { IconCheck, IconClose } from "../components/Icon";
import { LoadingModal } from "../components/LoadingModal";
import { Alert } from "../lib/Alert";
import CURRENT_USER_QUERY from "../lib/currentUserQuery.graphql";
import LOGIN_MUTATION from "../lib/loginMutation.graphql";
import { Storage } from "../lib/Storage";
import { SPACING } from "../lib/styles";

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: SPACING.normal
  },
  avatar: {
    marginTop: SPACING.normal,
    marginBottom: SPACING.normal
  },
  loginButton: {
    paddingHorizontal: SPACING.normal,
    justifyContent: "center",
    height: "100%"
  }
});

const DEFAULT_VALUES = {
  username: "",
  password: ""
};

const SignupSchema = Yup.object().shape({
  username: Yup.string().required("Required"),
  password: Yup.string().required("Required")
});

class RawLoginPage extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: "Login",
    headerRight: (
      <TouchableOpacity onPress={navigation.getParam("onSubmit")}>
        <View style={styles.loginButton}>
          <IconCheck size={14} color="white" />
        </View>
      </TouchableOpacity>
    ),
    headerLeft: (
      <TouchableOpacity onPress={navigation.dismiss}>
        <View style={styles.loginButton}>
          <IconClose size={14} color="white" />
        </View>
      </TouchableOpacity>
    )
  });
  state = { isLoading: false };

  emailInputRef = React.createRef<TextInput>();
  passwordInputRef = React.createRef<TextInput>();
  passwordConfirmationInputRef = React.createRef<TextInput>();
  usernameInputRef = React.createRef<TextInput>();

  selectPasswordInput = () => {
    this.passwordInputRef.current.focus();
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isLoading && !prevState.isLoading) {
      Keyboard.dismiss();
    }
  }

  handleSubmit = async ({ username, password }) => {
    if (this.state.isLoading) {
      return;
    }

    this.setState({ isLoading: true });

    try {
      const {
        data: { login }
      } = await this.props.login({
        variables: { username, password }
      });

      this.setState({ isLoading: false }, () => {
        if (login) {
          const onFinish = this.props.navigation.getParam("onFinish");

          this.props.navigation.dismiss();
          if (onFinish) {
            InteractionManager.runAfterInteractions(() => {
              onFinish();
            });
          }
        } else {
          Alert.alert(
            "Incorrect username or password – please re-enter it and try again."
          );
        }
      });
    } catch (exception) {
      const [firstError = null] = exception.graphQLErrors;

      this.setState({ isLoading: false }, () => {
        this.errorMessageInteraction = InteractionManager.runAfterInteractions(
          () => {
            if (firstError && firstError.message) {
              Alert.alert(firstError.message);
            } else {
              Alert.alert("Something went wrong. Please try again.");
            }
          }
        );
      });
    }
  };

  componentWillUnmount() {
    this.errorMessageInteraction && this.errorMessageInteraction.cancel();
  }

  componentDidMount() {
    this.props.navigation.setParams({
      onSubmit: this.formRef.handleSubmit
    });
  }

  setFormRef = formRef => (this.formRef = formRef);

  setScrollRef = (scrollRef: ScrollView) => (this.scrollRef = scrollRef);

  render() {
    return (
      <View style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          innerRef={this.setScrollRef}
          keyboardShouldPersistTaps
          contentContainerStyle={{ flex: 1 }}
        >
          <Formik
            ref={this.setFormRef}
            validationSchema={SignupSchema}
            initialValues={DEFAULT_VALUES}
            onSubmit={this.handleSubmit}
          >
            {props => (
              <View style={styles.form}>
                <FormField
                  label="Username"
                  required
                  autoCompleteType="username"
                  autoCapitalize="none"
                  keyboardType="ascii-capable"
                  inputRef={this.usernameInputRef}
                  autoFocus
                  onSubmitEditing={this.selectPasswordInput}
                  returnKeyType="next"
                  value={props.values.username}
                  error={props.touched.username && props.errors.username}
                  onChangeText={props.handleChange("username")}
                  onBlur={props.handleBlur("username")}
                  placeholder="LilNasX"
                />

                <FormField
                  label="Password"
                  required
                  secureTextEntry
                  error={props.touched.password && props.errors.password}
                  autoCompleteType="password"
                  onSubmitEditing={props.handleSubmit}
                  autoCapitalize="none"
                  inputRef={this.passwordInputRef}
                  returnKeyType="next"
                  value={props.values.password}
                  onChangeText={props.handleChange("password")}
                  onBlur={props.handleBlur("password")}
                  placeholder="******"
                />
              </View>
            )}
          </Formik>
        </KeyboardAwareScrollView>
        {this.state.isLoading && (
          <LoadingModal visible={this.state.isLoading} />
        )}
      </View>
    );
  }
}

const updateStore = (store, { data: { login } }) => {
  if (login && login.jwt !== null) {
    Storage.setUserId(login.id);
    Storage.setJWT(login.jwt);
    store.writeQuery({
      query: CURRENT_USER_QUERY,
      data: { currentUser: login }
    });
  }
};

export const LoginPage = props => {
  return (
    <Mutation mutation={LOGIN_MUTATION} update={updateStore}>
      {login => <RawLoginPage {...props} login={login} />}
    </Mutation>
  );
};

LoginPage.navigationOptions = RawLoginPage.navigationOptions;

export default LoginPage;
