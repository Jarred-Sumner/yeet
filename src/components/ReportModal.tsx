import * as React from "react";
import { View, StyleSheet, KeyboardAvoidingView } from "react-native";
import {
  TouchableOpacity,
  ScrollView,
  TextInput,
  NativeViewGestureHandler
} from "react-native-gesture-handler";
import { Modal } from "./Modal";
import { SPACING, COLORS } from "../lib/styles";
import { SemiBoldText, Text, MediumText } from "./Text";
import { Button } from "./Button";
import {
  CheckboxGroup,
  CheckboxOption,
  CheckboxValue,
  CheckboxOptions
} from "./Checkbox";
import { IconCircleCheckmark } from "./Icon";
import { useMutation } from "react-apollo";
import {
  CreateReportMutation,
  CreateReportMutationVariables
} from "../lib/graphql/CreateReportMutation";
import CREATE_REPORT_MUTATION from "../lib/CreateReportMutation.graphql";
import { sendToast, ToastType } from "./Toast";
import { BOTTOM_Y } from "../../config";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fcfcfc",
    borderTopLeftRadius: 4,
    width: "100%",
    borderTopRightRadius: 4,
    paddingTop: SPACING.double
  },
  button: {
    marginBottom: SPACING.normal
  },
  title: {
    fontSize: 27,
    marginHorizontal: SPACING.double,
    marginBottom: SPACING.double,
    textAlign: "center",
    alignSelf: "center"
  },
  emphasisText: {
    color: COLORS.primary
  },
  regularText: {
    color: "#333"
  },
  loginText: {
    fontSize: 18
  },
  spacer: {
    height: SPACING.normal,
    width: 1
  },
  loginContainer: {
    paddingVertical: SPACING.double,
    borderTopColor: "#eee",
    borderTopWidth: 1,
    marginTop: SPACING.normal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#ccc",
    borderBottomColor: "#ccc",

    color: "#333",
    width: "100%",
    paddingHorizontal: SPACING.normal,
    paddingTop: SPACING.normal,
    paddingBottom: SPACING.normal,
    marginBottom: SPACING.normal,
    marginTop: SPACING.half
  }
});

const REPORT_OPTIONS_MAP = {
  i_dont_like_this: "I'm in this and I don't like it.",
  uncomfortable: "This makes me uncomfortable.",
  abusive: "This person is threatening the safety of others.",
  suicidal: "This person is threatening self-harm.",
  bullying: "This person is being mean.",
  spam: "This is spammy.",
  community_guidelines: "Its against community guidelines"
};

const REPORT_OPTIONS: CheckboxOptions = Object.entries(
  REPORT_OPTIONS_MAP
).map(([value, label]) => ({ value, label }));

const ReportModalComponent = ({ onSubmit, onDismiss }) => {
  const [kinds, setKinds] = React.useState<Array<CheckboxValue>>([]);
  const [body, setBody] = React.useState("");
  const [isSubmitting, setSubmitting] = React.useState(false);

  const handleSubmit = React.useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setSubmitting(true);

    onSubmit({ body, kinds }).then(
      () => {
        onDismiss();

        sendToast("Report sent.", ToastType.success);
      },
      err => {
        sendToast("Please try again.", ToastType.error);
        setSubmitting(false);
      }
    );
  }, [kinds, body, onSubmit, setSubmitting, isSubmitting, onDismiss]);

  return (
    <>
      <KeyboardAvoidingView behavior="position">
        <ScrollView
          contentInset={{
            top: 0,
            bottom: BOTTOM_Y,
            left: 0,
            right: 0
          }}
          style={styles.container}
        >
          <SemiBoldText style={[styles.title, styles.regularText]}>
            What's wrong?
          </SemiBoldText>

          <CheckboxGroup
            options={REPORT_OPTIONS}
            values={kinds}
            onChange={setKinds}
          />

          <TextInput
            multiline
            numberOfLines={2}
            scrollEnabled={false}
            placeholder="Anything else?"
            defaultValue={""}
            onChangeText={setBody}
            style={styles.input}
          />

          <Button disabled={isSubmitting} onPress={handleSubmit}>
            Submit report
          </Button>
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export const ReportModal = ({ visible, id, type, onDismiss }) => {
  const [createReportMutation] = useMutation<
    CreateReportMutation,
    CreateReportMutationVariables
  >(CREATE_REPORT_MUTATION);

  const handleCreate = React.useCallback(
    ({ body, kinds }) => {
      return createReportMutation({
        variables: {
          body,
          kinds,
          id,
          type
        }
      });
    },
    [id, type, createReportMutation, onDismiss]
  );

  return (
    <Modal visible={visible} onDismiss={onDismiss}>
      <ReportModalComponent onSubmit={handleCreate} onDismiss={onDismiss} />
    </Modal>
  );
};

export default ReportModal;
