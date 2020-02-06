import React, { useImperativeHandle } from "react";
import { findNodeHandle } from "react-native";
import { MediaPlayerComponent } from "./MediaPlayerComponent";
import { uniq } from "lodash";

export enum MediaPlayerStatus {
  pending = "pending",
  loading = "loading",
  loaded = "loaded",
  ready = "ready",
  playing = "playing",
  paused = "paused",
  ended = "ended",
  error = "error"
}

type MediaPlayerContextValue = {
  registerID: (id: string, nodeHandle: number) => void;
  unregisterID: (id: string) => void;
};

export const MediaPlayerPauser = React.forwardRef(
  ({ children, nodeRef, isHidden }, ref) => {
    const players = React.useRef({});
    const pausedPlayers = React.useRef([]);
    const trackIsHidden = React.useRef(false);

    const registerID = React.useCallback(
      (id: string, instance: Object) => {
        players.current = {
          ...players.current,
          [id]: instance
        };
      },
      [uniq, players]
    );

    const unregisterID = React.useCallback(
      (id: string) => {
        let _players = { ...players.current };
        _players[id] = null;
        players.current = _players;

        if (pausedPlayers.current.includes(id)) {
          pausedPlayers.current.splice(pausedPlayers.current.indexOf(id), 1);
        }
      },
      [uniq, players]
    );

    const pausePlayers = React.useCallback(() => {
      if (Object.keys(players.current).length === 0) {
        return;
      }

      // const handle = findNodeHandle(nodeRef.current) ?? -1;
      MediaPlayerComponent.batchPause(
        -1,
        Object.values(players.current)
          .map(findNodeHandle)
          .filter(Boolean)
      );
      pausedPlayers.current = uniq([
        ...pausedPlayers.current,
        ...Object.values(players.current)
      ]);
    }, [players, pausedPlayers, nodeRef]);

    const unpausePlayers = React.useCallback(() => {
      // const handle = findNodeHandle(nodeRef.current);
      if (pausedPlayers.current.length > 0) {
        console.log("PLAYERS", pausedPlayers.current);
        MediaPlayerComponent.batchPlay(
          -1,
          pausedPlayers.current.filter(Boolean)
        );
        pausedPlayers.current = [];
      }
    }, [players, pausedPlayers, nodeRef]);

    const contextValue = React.useMemo(() => {
      return {
        registerID,
        unregisterID,
        pausePlayers,
        unpausePlayers
      };
    }, [registerID, unregisterID]);

    // useFocusEffect(
    //   React.useCallback(() => {
    //     console.log("UNPAUSE");
    //     unpausePlayers();

    //     return () => {
    //       console.log("PAUSE");
    //       pausePlayers();
    //     };
    //   }, [pausePlayers, unpausePlayers])
    // );

    React.useEffect(() => {
      if (isHidden === true) {
        pausePlayers();
      } else if (isHidden === false) {
        unpausePlayers();
      }
    }, [pausePlayers, unpausePlayers, isHidden]);

    useImperativeHandle(ref, () => ({
      pausePlayers,
      unpausePlayers
    }));

    return (
      <MediaPlayerContext.Provider value={contextValue}>
        {children}
      </MediaPlayerContext.Provider>
    );
  }
);

export const MediaPlayerContext = React.createContext<MediaPlayerContextValue | null>(
  null
);
