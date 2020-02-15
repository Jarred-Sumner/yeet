import * as React from "react";
import {
  YeetClipboard,
  ClipboardResponse,
  listenToClipboardChanges,
  stopListeningToClipboardChanges,
  listenToClipboardRemove,
  stopListeningToClipboardRemove,
  getClipboardMediaSource
} from "./YeetClipboard";
import { MediaSource } from "../MediaPlayer";
import { memoize } from "lodash";

export type Clipboard = {
  clipboard: ClipboardResponse;
  mediaSource: MediaSource | null;
};

export const ClipboardContext = React.createContext<Clipboard>({
  clipboard: YeetClipboard.clipboard,
  mediaSource: YeetClipboard.mediaSource || null
});

type State = {
  contextValue: Clipboard;
};

export class ClipboardProvider extends React.Component<{}, State> {
  constructor(props) {
    super(props);

    this.state = {
      contextValue: ClipboardProvider.buildContextValue(
        YeetClipboard.clipboard,
        YeetClipboard.mediaSource || null
      )
    };
  }

  static _buildContextValue(
    clipboard: ClipboardResponse,
    mediaSource: MediaSource | null
  ): Clipboard {
    return {
      clipboard,
      mediaSource
    };
  }

  handleClipboardChange = async (clipboard: ClipboardResponse) => {
    console.warn("CLIPBOARD CHANGE", clipboard);

    try {
      const mediaSource = await getClipboardMediaSource();
      this.setState({
        contextValue: ClipboardProvider.buildContextValue(
          clipboard,
          mediaSource || null
        )
      });
    } catch (excpetion) {
      console.error(exception);
      this.setState({
        contextValue: ClipboardProvider.buildContextValue(clipboard, null)
      });
    }
  };

  static buildContextValue = memoize(ClipboardProvider._buildContextValue);

  componentDidMount() {
    listenToClipboardChanges(this.handleClipboardChange);
    listenToClipboardRemove(this.handleClipboardChange);

    if (
      this.state.contextValue.clipboard.hasImages &&
      !this.state.contextValue.mediaSource
    ) {
      this.updateMediaSource();
    }
  }

  updateMediaSource = async () => {
    const mediaSource = await getClipboardMediaSource();
    this.setState({
      contextValue: ClipboardProvider.buildContextValue(
        this.state.contextValue.clipboard,
        mediaSource
      )
    });
  };

  componentWillUnmount() {
    stopListeningToClipboardChanges(this.handleClipboardChange);
    stopListeningToClipboardRemove(this.handleClipboardChange);
  }

  render() {
    return (
      <ClipboardContext.Provider value={this.state.contextValue}>
        {this.props.children}
      </ClipboardContext.Provider>
    );
  }
}
