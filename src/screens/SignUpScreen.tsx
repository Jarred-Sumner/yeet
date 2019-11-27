import { Formik } from "formik";
import * as React from "react";
import { Mutation } from "react-apollo";
import {
  InteractionManager,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Settings
} from "react-native";
import HapticFeedback from "react-native-haptic-feedback";
import LinearGradient from "react-native-linear-gradient";
import { StackNavigatorConfig } from "react-navigation";
import { sample } from "lodash";
import * as Yup from "yup";
import { BASE_HOSTNAME, SCREEN_DIMENSIONS } from "../../config";
import {
  BackButton,
  Button,
  useBackButtonBehavior
} from "../components/Button";
import { FormField } from "../components/FormField";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";
import { Link } from "../components/Link";
import { LoadingModal } from "../components/LoadingModal";
import { MediumText } from "../components/Text";
import { Alert } from "../lib/Alert";
import CURRENT_USER_QUERY from "../lib/currentUserQuery.graphql";
import SIGN_UP_MUTATION from "../lib/signUpMutation.graphql";
import { Storage, WATCH_KEYS } from "../lib/Storage";
import { COLORS, SPACING } from "../lib/styles";
import { getPlaceholderUsername } from "../lib/usernames";
import { UserContext } from "../components/UserContext";
import { Compliance } from "../components/Compliance";

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: SPACING.normal,
    paddingTop: SPACING.double
  },
  avatar: {
    marginTop: SPACING.normal,
    marginBottom: SPACING.normal,
    height: 60
  },

  signUpButton: {
    paddingHorizontal: SPACING.normal,
    justifyContent: "center",
    flex: 1,
    maxWidth: "100%"
  }
});

export const Background = React.memo(
  ({ width = SCREEN_DIMENSIONS.width, height = SCREEN_DIMENSIONS.height }) => (
    <LinearGradient
      width={width}
      height={height}
      useAngle
      pointerEvents="none"
      angle={141.38}
      angleCenter={{ x: 0.5, y: 0.5 }}
      colors={[COLORS.primaryDark, "#AE57FF"].reverse()}
      start={{ x: 0, y: 0 }}
      locations={[0.2527, 0.7016]}
      style={[StyleSheet.absoluteFill, styles.background]}
    />
  )
);

const DEFAULT_VALUES = {
  mediaId: null,
  username: "",
  password: "",
  passwordConfirmation: "",
  email: ""
};

const SignupSchema = Yup.object().shape({
  email: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .email()
    .trim()
    .notOneOf(["my.real.email@gmail.com"], "Please use your real email :-)")
    .required("Required"),
  username: Yup.string()
    .min(1, "Required")
    .max(50, "Too Long!")
    .trim()
    .notOneOf(["NasMaraj", "username"], "That username is taken.")
    .required("Required"),
  password: Yup.string()
    .min(3, "Too short!")
    .required("Required"),
  passwordConfirmation: Yup.string().oneOf(
    [Yup.ref("password"), null],
    "Passwords must match"
  )
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

class RawSignUpPage extends React.Component {
  static navigationOptions = ({ navigation }): StackNavigatorConfig => ({
    title: "Sign up",
    mode: "stack",
    headerLeft: () => {
      if (navigation.getParam("hideBack") === true) {
        return null;
      }
      return <HeaderLeftButton />;
    }
  });
  state = { isLoading: false };

  emailInputRef = React.createRef<TextInput>();
  passwordInputRef = React.createRef<TextInput>();
  passwordConfirmationInputRef = React.createRef<TextInput>();
  usernameInputRef = React.createRef<TextInput>();

  selectEmailInput = () => {
    this.emailInputRef.current.focus();
  };
  selectUsernameInput = () => {
    this.usernameInputRef.current.focus();
  };
  selectPasswordInput = () => {
    this.passwordInputRef.current.focus();
  };
  selectPasswordConfirmationInput = () => {
    this.passwordConfirmationInputRef.current.focus();
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isLoading && !prevState.isLoading) {
      Keyboard.dismiss();
    }
  }

  handleSubmit = async ({ mediaId, username, password, email }) => {
    if (this.state.isLoading) {
      return;
    }

    Keyboard.dismiss();

    this.setState({ isLoading: true });
    HapticFeedback.trigger("impactLight");

    try {
      const response = await this.props.signUp({
        variables: { mediaId, username, password, email }
      });
      this.setState({ isLoading: false });

      Settings.set({
        [WATCH_KEYS.WAITLILST]: true
      });

      this.props.navigation.push("Birthday", {
        onFinish: this.props.navigation.getParam("onFinish"),
        isOnboarding: true
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

  setFormRef = formRef => (this.formRef = formRef);

  setScrollRef = (scrollRef: ScrollView) => (this.scrollRef = scrollRef);

  handleChangeAvatar = onChangeFunc => value => {
    onChangeFunc(value);

    this.usernameInputRef.current.focus();
  };

  placeholder = getPlaceholderUsername();

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Background />
        <KeyboardAwareScrollView
          innerRef={this.setScrollRef}
          keyboardShouldPersistTaps="always"
          style={{ flex: 1, backgroundColor: "transparent" }}
          paddingTop={0}
          paddingBottom={0}
          contentInsetAdjustmentBehavior="automatic"
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
                  maxLength={40}
                  blurOnSubmit={false}
                  keyboardType="ascii-capable"
                  inputRef={this.usernameInputRef}
                  spellcheck={false}
                  importantForAutofill
                  enablesReturnKeyAutomatically={false}
                  textContentType="username"
                  autoFocus
                  onSubmitEditing={this.selectEmailInput}
                  returnKeyType="next"
                  value={props.values.username}
                  error={props.touched.username && props.errors.username}
                  onChangeText={props.handleChange("username")}
                  onBlur={props.handleBlur("username")}
                  placeholder={this.placeholder}
                />

                <FormField
                  label="Email"
                  required
                  autoCompleteType="email"
                  autoCapitalize="none"
                  blurOnSubmit={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  importantForAutofill
                  enablesReturnKeyAutomatically={false}
                  returnKeyType="next"
                  inputRef={this.emailInputRef}
                  onSubmitEditing={this.selectPasswordInput}
                  error={props.touched.email && props.errors.email}
                  value={props.values.email}
                  onChangeText={props.handleChange("email")}
                  onBlur={props.handleBlur("email")}
                  placeholder="my.real.email@gmail.com"
                />

                <FormField
                  label="Password"
                  required
                  secureTextEntry
                  name="password"
                  textContentType="none"
                  autoCorrect={false}
                  importantForAutofill
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically={false}
                  error={props.touched.password && props.errors.password}
                  autoCompleteType="password"
                  onSubmitEditing={this.selectPasswordConfirmationInput}
                  autoCapitalize="none"
                  inputRef={this.passwordInputRef}
                  returnKeyType="next"
                  defaultValue={props.values.password}
                  onChangeText={props.handleChange("password")}
                  onBlur={props.handleBlur("password")}
                  placeholder="Password"
                />

                <FormField
                  required
                  secureTextEntry
                  name="confirmPassword"
                  textContentType="none"
                  blurOnSubmit={false}
                  autoCorrect={false}
                  enablesReturnKeyAutomatically={false}
                  // onSubmitEditing={props.handleSubmit}
                  importantForAutofill
                  inputRef={this.passwordConfirmationInputRef}
                  returnKeyType="go"
                  error={
                    props.touched.passwordConfirmation &&
                    props.errors.passwordConfirmation
                  }
                  autoCompleteType="off"
                  autoCapitalize="none"
                  defaultValue={props.values.passwordConfirmation}
                  onChangeText={props.handleChange("passwordConfirmation")}
                  onBlur={props.handleBlur("passwordConfirmation")}
                  placeholder="Password confirmation"
                />

                <Button
                  color={COLORS.secondary}
                  style={styles.signUpButton}
                  onPress={props.handleSubmit}
                >
                  Create account
                </Button>

                <Compliance />
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

const updateStore = (store, { data: { signUp } }) => {
  if (signUp && signUp.jwt !== null) {
    Storage.setUserId(signUp.id);
    Storage.setJWT(signUp.jwt);
    store.writeQuery({
      query: CURRENT_USER_QUERY,
      data: { currentUser: signUp }
    });
  }
};

export const SignUpPage = props => {
  return (
    <Mutation mutation={SIGN_UP_MUTATION} update={updateStore}>
      {signUp => <RawSignUpPage {...props} signUp={signUp} />}
    </Mutation>
  );
};

SignUpPage.navigationOptions = RawSignUpPage.navigationOptions;

export default SignUpPage;
