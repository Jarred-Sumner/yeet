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
import * as Yup from "yup";
import { FormField } from "../components/FormField";
import { IconCheck, IconClose } from "../components/Icon";
import { LoadingModal } from "../components/LoadingModal";
import { Alert } from "../lib/Alert";
import CURRENT_USER_QUERY from "../lib/currentUserQuery.graphql";
import LOGIN_MUTATION from "../lib/loginMutation.graphql";
import { Storage } from "../lib/Storage";
import { SPACING } from "../lib/styles";
import HapticFeedback from "react-native-haptic-feedback";
import { Background } from "./SignUpScreen";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { useBackButtonBehavior, BackButton } from "../components/Button";
import { resetTo } from "../lib/NavigationService";
import { getPlaceholderUsername } from "../lib/usernames";
import { UserContext } from "../components/UserContext";

const styles = StyleSheet.create({
  form: {
    padding: SPACING.normal
  },
  avatar: {
    marginTop: SPACING.normal,
    marginBottom: SPACING.normal
  },
  loginButton: {
    paddingHorizontal: SPACING.normal,
    justifyContent: "flex-end",
    alignItems: "center",
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

const HeaderLeftButton = () => {
  const behavior = useBackButtonBehavior();
  const userContext = React.useContext(UserContext);

  return (
    <BackButton
      behavior={behavior}
      size={18}
      onPress={userContext.hideAuthModal}
    />
  );
};

class RawLoginPage extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: "Login",
    headerRight: () => (
      <TouchableOpacity onPress={navigation.getParam("onSubmit")}>
        <View style={styles.loginButton}>
          <IconCheck size={14} color="white" />
        </View>
      </TouchableOpacity>
    ),
    headerLeft: () => <HeaderLeftButton />
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

    HapticFeedback.trigger("impactLight");

    try {
      const {
        data: { login }
      } = await this.props.login({
        variables: { username, password }
      });

      this.setState({ isLoading: false }, () => {
        if (login) {
          const onFinish = this.props.navigation.getParam("onFinish");

          HapticFeedback.trigger("notificationSuccess");
          if (onFinish) {
            this.props.navigation.dismiss();
            InteractionManager.runAfterInteractions(() => {
              onFinish();
              this.props.userContext.hideAuthModal();
            });
          } else {
            resetTo("ThreadList", {});
            this.props.userContext.hideAuthModal();
          }
        } else {
          HapticFeedback.trigger("notificationError");
          Alert.alert(
            "Incorrect username or password – please re-enter it and try again."
          );
        }
      });
    } catch (exception) {
      const [firstError = null] = exception.graphQLErrors;

      this.setState({ isLoading: false }, () => {
        HapticFeedback.trigger("notificationError");
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

  placeholder = getPlaceholderUsername();

  renderForm = props => (
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
        placeholder={this.placeholder}
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
        placeholder="Password"
      />
    </View>
  );

  setFormRef = formRef => (this.formRef = formRef);

  setScrollRef = (scrollRef: ScrollView) => (this.scrollRef = scrollRef);

  render() {
    return (
      <View style={{ flex: 1, position: "relative" }}>
        <Background />

        <KeyboardAwareScrollView
          innerRef={this.setScrollRef}
          paddingTop={0}
          paddingBottom={0}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="always"
          style={{ flex: 1, backgroundColor: "transparent" }}
        >
          <Formik
            ref={this.setFormRef}
            validationSchema={SignupSchema}
            initialValues={DEFAULT_VALUES}
            onSubmit={this.handleSubmit}
          >
            {this.renderForm}
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
  const userContext = React.useContext(UserContext);
  return (
    <Mutation mutation={LOGIN_MUTATION} update={updateStore}>
      {login => (
        <RawLoginPage {...props} userContext={userContext} login={login} />
      )}
    </Mutation>
  );
};

LoginPage.navigationOptions = RawLoginPage.navigationOptions;

export default LoginPage;
