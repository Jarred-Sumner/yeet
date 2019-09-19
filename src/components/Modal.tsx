import * as React from "react";
import { StyleSheet } from "react-native";
import RNModal from "react-native-modal";

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "transparent",
    flex: 1,
    width: "100%",
    zIndex: 100
  },
  bottom: {
    alignItems: "flex-end"
  },
  center: {
    alignItems: "center"
  }
});

export class Modal extends React.Component {
  backdropRef = React.createRef();
  contentRef = React.createRef();

  render() {
    const {
      visible,
      onRequestClose,
      onShow,
      onDismiss,
      align = "bottom",
      swipeToDismiss = true,
      children
    } = this.props;

    return (
      <RNModal
        onDismiss={onDismiss}
        useNativeDriver
        hasBackdrop
        isVisible={visible}
        swipeDirection={swipeToDismiss ? "down" : null}
        onSwipeComplete={swipeToDismiss ? onDismiss : undefined}
        // onBackButtonPress={onDismiss}
        // onBackdropPress={onDismiss}
        transparent
        style={[styles.content, styles[align]]}
        animationType="none"
        animationIn={swipeToDismiss ? "slideInUp" : "fadeIn"}
        animationOut={swipeToDismiss ? "slideOutDown" : "fadeOut"}
        presentationStyle="overFullScreen"
      >
        {children}
      </RNModal>
    );
  }
}

export default Modal;
