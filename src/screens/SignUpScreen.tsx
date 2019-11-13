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
import HapticFeedback from "react-native-haptic-feedback";
import * as Yup from "yup";
import { EditableAvatar } from "../components/EditableAvatar";
import { FormField } from "../components/FormField";
import { IconCheck, IconClose } from "../components/Icon";
import { LoadingModal } from "../components/LoadingModal";
import { Alert } from "../lib/Alert";
import CURRENT_USER_QUERY from "../lib/currentUserQuery.graphql";
import SIGN_UP_MUTATION from "../lib/signUpMutation.graphql";
import { Storage } from "../lib/Storage";
import { SPACING } from "../lib/styles";
import { TOP_Y, BOTTOM_Y } from "../../config";
import { KeyboardAwareScrollView } from "../components/KeyboardAwareScrollView";

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: SPACING.normal
  },
  avatar: {
    marginTop: SPACING.normal,
    marginBottom: SPACING.normal
  },
  signUpButton: {
    paddingHorizontal: SPACING.normal,
    justifyContent: "center",
    height: "100%"
  }
});

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

class RawSignUpPage extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: "Sign up",
    headerRight: () => (
      <TouchableOpacity onPress={navigation.getParam("onSubmit")}>
        <View style={styles.signUpButton}>
          <IconCheck size={14} color="white" />
        </View>
      </TouchableOpacity>
    ),
    headerLeft: () => (
      <TouchableOpacity onPress={navigation.dismiss}>
        <View style={styles.signUpButton}>
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

    this.setState({ isLoading: true });
    HapticFeedback.trigger("impactLight");

    try {
      const response = await this.props.signUp({
        variables: { mediaId, username, password, email }
      });
      this.setState({ isLoading: false });

      const onFinish = this.props.navigation.getParam("onFinish");
      HapticFeedback.trigger("notificationSuccess");

      this.props.navigation.dismiss();
      if (onFinish) {
        InteractionManager.runAfterInteractions(() => {
          onFinish();
        });
      }
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

  render() {
    return (
      <View style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          innerRef={this.setScrollRef}
          keyboardShouldPersistTaps
          style={{ flex: 1, backgroundColor: "pink" }}
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
                <View style={styles.avatar}>
                  <EditableAvatar
                    value={props.values.mediaId}
                    size={75}
                    onChange={this.handleChangeAvatar(
                      props.handleChange("mediaId")
                    )}
                    onBlur={props.handleBlur("mediaId")}
                  />
                </View>

                <FormField
                  label="Username"
                  required
                  autoCompleteType="username"
                  autoCapitalize="none"
                  keyboardType="ascii-capable"
                  inputRef={this.usernameInputRef}
                  autoFocus
                  onSubmitEditing={this.selectEmailInput}
                  returnKeyType="next"
                  value={props.values.username}
                  error={props.touched.username && props.errors.username}
                  onChangeText={props.handleChange("username")}
                  onBlur={props.handleBlur("username")}
                  placeholder="LilNasX"
                />

                <FormField
                  label="Email"
                  required
                  autoCompleteType="email"
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                  error={props.touched.password && props.errors.password}
                  autoCompleteType="password"
                  onSubmitEditing={this.selectPasswordConfirmationInput}
                  autoCapitalize="none"
                  inputRef={this.passwordInputRef}
                  returnKeyType="next"
                  value={props.values.password}
                  onChangeText={props.handleChange("password")}
                  onBlur={props.handleBlur("password")}
                  placeholder="******"
                />

                <FormField
                  label="Password confirmation"
                  required
                  secureTextEntry
                  onSubmitEditing={props.handleSubmit}
                  blurOnSubmit
                  inputRef={this.passwordConfirmationInputRef}
                  returnKeyType="go"
                  error={
                    props.touched.passwordConfirmation &&
                    props.errors.passwordConfirmation
                  }
                  autoCompleteType="password"
                  autoCapitalize="none"
                  value={props.values.passwordConfirmation}
                  onChangeText={props.handleChange("passwordConfirmation")}
                  onBlur={props.handleBlur("passwordConfirmation")}
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
