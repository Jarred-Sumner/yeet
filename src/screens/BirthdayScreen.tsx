import { subYears } from "date-fns/esm";
import hoistNonReactStatics from "hoist-non-react-statics";
import { capitalize } from "lodash";
import * as React from "react";
import { useMutation } from "react-apollo";
import { StyleSheet, View, Keyboard } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import SafeAreaView from "react-native-safe-area-view";
import { useNavigation, useRoute } from "@react-navigation/core";
import { NavigationStackOptions } from "react-navigation-stack";
import { DatePicker } from "../components/DatePicker";
import { BoldText, Text, MediumText } from "../components/Text";
import { sendToast, ToastType } from "../components/Toast";
import {
  UpdateBirthday,
  UpdateBirthdayVariables
} from "../lib/graphql/UpdateBirthday";
import { COLORS, SPACING } from "../lib/styles";
import UPDATE_BIRTHDAY_MUTATION from "../lib/UpdateBirthdayMutation.graphql";
import { COPY_BY_SIGN, getSign, ZodiacIcon } from "../lib/zodiac";
import {
  Transitioning,
  TransitioningView,
  Transition
} from "react-native-reanimated";
import Animated from "react-native-reanimated";

const styles = StyleSheet.create({
  sign: {
    paddingTop: SPACING.double * 2,
    paddingBottom: SPACING.double * 2,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  },
  datePicker: {
    backgroundColor: "#eee",
    position: "relative",
    zIndex: 100,
    width: "100%"
  },
  title: {
    marginTop: SPACING.double,
    fontSize: 48,
    textAlign: "center",
    color: "#fff"
  },
  paragraph: {
    fontSize: 18,
    color: "#eee",
    paddingTop: SPACING.double,
    paddingBottom: SPACING.double,
    paddingHorizontal: SPACING.double
  },
  placeholder: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center",
    marginTop: SPACING.double
  },
  right: {
    color: "white",
    fontSize: 18
  }
});

class RawBirthdayScreen extends React.Component {
  static navigationOptions = ({ navigation }): NavigationStackOptions => ({
    title: "Whats your sign?",
    headerLeft: null,
    headerRight: () => (
      <TouchableOpacity onPress={navigation.getParam("onPressNext")}>
        <View>
          <BoldText style={styles.right}>Next</BoldText>
        </View>
      </TouchableOpacity>
    )
  });

  componentDidMount() {
    Keyboard.dismiss();
  }

  maxDate = subYears(new Date(), 13);
  minDate = subYears(new Date(), 100);

  transitionRef = React.createRef<TransitioningView>();

  handleChange = date => {
    this.props.onChange(date);
    if (!this.props.showZodiac) {
      this.transitionRef.current.animateNextTransition();
    }
  };

  render() {
    const { date, zodiac, showZodiac } = this.props;

    return (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: COLORS.primary,
          justifyContent: "space-between"
        }}
      >
        <ScrollView
          style={{ flex: 1, overflow: "visible" }}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Transitioning.View
            transition={
              <Transition.Together>
                <Transition.In
                  type="fade"
                  interpolation="easeIn"
                  durationMs={200}
                />
              </Transition.Together>
            }
            ref={this.transitionRef}
          >
            {showZodiac ? (
              <Animated.View key="zodiac" style={styles.sign}>
                <ZodiacIcon
                  sign={zodiac}
                  size={120}
                  color="#fff"
                  style={styles.zodiac}
                />
                <BoldText style={styles.title}>{capitalize(zodiac)}</BoldText>
                <Text style={styles.paragraph}>{COPY_BY_SIGN[zodiac]}</Text>
              </Animated.View>
            ) : (
              <Animated.View key="sign">
                <MediumText style={styles.placeholder}>
                  Enter your birthday
                </MediumText>
              </Animated.View>
            )}
          </Transitioning.View>
        </ScrollView>

        <SafeAreaView
          style={styles.datePicker}
          forceInset={{
            top: "never",
            bottom: "always",
            left: "never",
            right: "never"
          }}
        >
          <DatePicker
            min={this.minDate}
            max={this.maxDate}
            value={date}
            onChange={this.handleChange}
          />
        </SafeAreaView>
      </Animated.View>
    );
  }
}

const _BirthdayScreen = props => {
  const [updateBirthday] = useMutation<UpdateBirthday, UpdateBirthdayVariables>(
    UPDATE_BIRTHDAY_MUTATION
  );
  const navigation = useNavigation();
  const [date, setDate] = React.useState(subYears(new Date(), 18));
  const [zodiac, setZodiac] = React.useState(null);
  const [showZodiac, setShowZodiac] = React.useState(false);

  const handleChangeDate = React.useCallback(
    date => {
      setDate(date);
      if (date) {
        setZodiac(getSign(date));
        setShowZodiac(true);
      } else {
        setZodiac(null);
        setShowZodiac(true);
      }
    },
    [setZodiac, setDate, setShowZodiac]
  );

  const route = useRoute();
  const { isOnboarding, onNextParam, onFinish } = route.params ?? {};

  React.useEffect(() => {
    navigation.setParams({
      onPressNext: () => {
        if (!showZodiac) {
          sendToast("Please enter your birthday", ToastType.error);
          return;
        }
        updateBirthday({
          variables: {
            birthday: date
          }
        });

        if (isOnboarding && !onNextParam) {
          navigation.navigate("UploadAvatar", {
            isOnboarding: true,
            onFinish
          });
        } else if (onNextParam) {
          onNextParam();
        } else {
          navigation.dismiss();
        }
      }
    });
  }, [date, sendToast, showZodiac, onNextParam, isOnboarding, onFinish]);

  return (
    <RawBirthdayScreen
      onChange={handleChangeDate}
      date={date}
      showZodiac={showZodiac}
      zodiac={zodiac}
    />
  );
};

export const BirthdayScreen = hoistNonReactStatics(
  _BirthdayScreen,
  RawBirthdayScreen
);

export default BirthdayScreen;
