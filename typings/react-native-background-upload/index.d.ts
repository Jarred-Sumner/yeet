import { EventSubscription } from "react-native";

declare module "react-native-background-upload" {
  type UploadEvent = "progress" | "error" | "completed" | "cancelled";

  interface NotificationArgs {
    enabled: boolean;
  }

  interface StartUploadArgs {
    url: string;
    path: string;
    method?: "PUT" | "POST";
    // Optional, because raw is default
    type?: "raw" | "multipart";
    // This option is needed for multipart type
    field?: string;
    customUploadId?: string;
    // parameters are supported only in multipart type
    parameters?: { [key: string]: string };
    headers?: Object;
    notification?: NotificationArgs;
  }

  export interface ProgressListener {
    ({ progress }: { progress: number }): void;
  }

  export interface ErrorListener {
    ({ error }: { error: Error }): void;
  }

  export interface CompletedListener {
    ({ responseCode }: { responseCode: number }): void;
  }

  type ListenerCallback = ProgressListener | ErrorListener | CompletedListener;

  function addListener(
    event: UploadEvent,
    uploadId: string | null,
    listener: ListenerCallback
  ): EventSubscription;

  function cancelUpload(uploadId: string): Promise<boolean>;

  function startUpload(options: StartUploadArgs): Promise<string>;

  interface FileInfo {
    name: string;
    exists: boolean;
    size?: number;
    extension?: string;
    mimeType?: string;
  }

  function getFileInfo(path: string): Promise<FileInfo>;
}
