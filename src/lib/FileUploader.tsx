import Upload from "react-native-background-upload";
import * as Sentry from "@sentry/react-native";

export const allowSuspendIfBackgrounded = () => Upload.canSuspendIfBackground();

export const createUploadListeners = ({
  uploadId,
  onCompleted = () => {},
  onCancel = () => {},
  onProgress = () => {},
  onError = () => {}
}) => {
  let progressListener, errorListener, completedListener, cancelledListener;
  let clearListeners = () => {};

  onProgress(0);

  progressListener = Upload.addListener(
    "progress",
    uploadId,
    ({ progress }) => {
      console.log(`Progress: ${progress}%`);

      onProgress(progress);
    }
  );

  errorListener = Upload.addListener("error", uploadId, data => {
    Sentry.captureException(data);
    console.log(`Error: ${data.error}%`);

    console.error(data.error);
    clearListeners();
    onError(data);
  });

  cancelledListener = Upload.addListener("cancelled", uploadId, data => {
    clearListeners();
    onCancel(data);
  });

  completedListener = Upload.addListener(
    "completed",
    uploadId,
    ({ responseCode, ...data }) => {
      if (responseCode >= 200 && responseCode <= 299) {
        onProgress(100);
        onCompleted(data);
      } else {
        onError({ ...data, responseCode });
        clearListeners();
      }
    }
  );

  clearListeners = () => {
    [
      progressListener?.remove?.bind(progressListener),
      errorListener?.remove?.bind(errorListener),
      completedListener?.remove?.bind(completedListener),
      cancelledListener?.remove?.bind(cancelledListener)
    ]
      .filter(func => typeof func === "function")
      .forEach(remover => {
        remover();
      });
  };

  allowSuspendIfBackgrounded();
};

export const uploadFile = ({
  file,
  url,
  headers,
  onError,
  onCancel,
  onCompleted,
  onProgress
}): Promise<string> => {
  return Upload.startUpload({
    url: url,
    path: file,
    method: "PUT",
    type: "raw",
    headers: {
      "content-type": "application/octet-stream", // Customize content-type,
      ...headers
    }
  }).then(uploadId => {
    createUploadListeners({
      onError,
      onCancel,
      onCompleted,
      onProgress,
      uploadId
    });

    return uploadId;
  });
};
