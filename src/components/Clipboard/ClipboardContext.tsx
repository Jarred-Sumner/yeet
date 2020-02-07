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
  lastHandledId: string | null;
  setLastHandledId: (id: string | null) => void;
};

export const ClipboardContext = React.createContext<Clipboard>({
  clipboard: YeetClipboard.clipboard,
  mediaSource: YeetClipboard.mediaSource || null,
  lastHandledId: null,
  setLastHandledId: () => {}
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
        YeetClipboard.mediaSource || null,
        null,
        this.handleChangeLastHandledId
      )
    };
  }

  handleChangeLastHandledId = (id: string | null) => {
    this.setState({
      contextValue: ClipboardProvider.buildContextValue(
        YeetClipboard.clipboard,
        this.state.contextValue.mediaSource,
        id,
        this.handleChangeLastHandledId
      )
    });
  };

  static _buildContextValue(
    clipboard: ClipboardResponse,
    mediaSource: MediaSource | null,
    lastHandledId: string | null,
    setLastHandledId: (id: string) => void
  ): Clipboard {
    return {
      clipboard,
      mediaSource,
      lastHandledId,
      setLastHandledId
    };
  }

  handleClipboardChange = async (clipboard: ClipboardResponse) => {
    console.warn("CLIPBOARD CHANGE", clipboard);

    try {
      const mediaSource = await getClipboardMediaSource();
      this.setState({
        contextValue: ClipboardProvider.buildContextValue(
          clipboard,
          mediaSource || null,
          this.state.contextValue.lastHandledId,
          this.handleChangeLastHandledId
        )
      });
    } catch (excpetion) {
      console.error(exception);
      this.setState({
        contextValue: ClipboardProvider.buildContextValue(
          clipboard,
          null,
          this.state.contextValue.lastHandledId,
          this.handleChangeLastHandledId
        )
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
        mediaSource,
        this.state.contextValue.lastHandledId,
        this.handleChangeLastHandledId
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
