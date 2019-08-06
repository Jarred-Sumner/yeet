import { NavigationActions } from "react-navigation";

let _navigator;

export function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

export function navigate(routeName, params) {
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params
    })
  );
}

export function navigateWithParent(routeName, parentRouteName, params) {
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName: parentRouteName,

      params: {},

      action: NavigationActions.navigate({ routeName: routeName, params })
    })
  );
}

// add other navigation functions that you need and export them

export default {
  navigate,
  navigateWithParent,
  setTopLevelNavigator
};
