import RNFetchBlob from "rn-fetch-blob";
import qs from "qs";
import { BASE_HOSTNAME } from "../../config";
import Promise from "bluebird";
import Upload from "react-native-background-upload";
import * as Sentry from "@sentry/react-native";
import { fromPairs } from "lodash";
import { convertCameraRollIDToRNFetchBlobId } from "./imageResize";

var Blob = RNFetchBlob.polyfill.Blob;
const fs = RNFetchBlob.fs;

S3Upload.prototype.server = BASE_HOSTNAME;
S3Upload.prototype.signingUrl = "/api/sign-s3";
S3Upload.prototype.signingUrlMethod = "GET";
S3Upload.prototype.signingUrlSuccessResponses = [200, 201];
S3Upload.prototype.fileElement = null;
S3Upload.prototype.files = null;

S3Upload.prototype.onFinishS3Put = function(signResult, file) {
  return console.log("base.onFinishS3Put()", signResult.publicUrl);
};

S3Upload.prototype.preprocess = function(file, next) {
  console.log("base.preprocess()", file);
  return next(file);
};

S3Upload.prototype.onProgress = function(percent, status, file) {
  return console.log("base.onProgress()", percent, status);
};

S3Upload.prototype.onError = function(status, file) {
  return console.log("base.onError()", status);
};

S3Upload.prototype.scrubFilename = function(filename) {
  return filename.replace(/[^\w\d_\-\.]+/gi, "");
};

function S3Upload(options) {
  if (options == null) {
    options = {};
  }
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }
  var files = this.fileElement ? this.fileElement.files : this.files || [];
  this.handleFileSelect(files);
}

S3Upload.prototype.handleFileSelect = function(files) {
  var result = [];
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    this.preprocess(
      file,
      function(processedFile) {
        this.onProgress(0, "Waiting", processedFile);
        result.push(this.uploadFile(processedFile));
        return result;
      }.bind(this)
    );
  }
};

S3Upload.prototype.createCORSRequest = function(method, url, opts) {
  var opts = opts || {};
  var xhr = new RNFetchBlob.polyfill.XMLHttpRequest();

  xhr.open(method, url, true);
  xhr.withCredentials = true;

  return xhr;
};

S3Upload.prototype.executeOnSignedUrl = function(file, callback) {
  var fileName = this.scrubFilename(file.name);
  var queryString =
    "?objectName=" +
    fileName +
    "&contentType=" +
    encodeURIComponent(file.type.replace(";", ""));
  if (this.s3path) {
    queryString += "&path=" + encodeURIComponent(this.s3path);
  }
  if (this.signingUrlQueryParams) {
    var signingUrlQueryParams =
      typeof this.signingUrlQueryParams === "function"
        ? this.signingUrlQueryParams()
        : this.signingUrlQueryParams;
    Object.keys(signingUrlQueryParams).forEach(function(key) {
      var val = signingUrlQueryParams[key];
      queryString += "&" + key + "=" + val;
    });
  }
  var xhr = this.createCORSRequest(
    this.signingUrlMethod,
    this.server + this.signingUrl + queryString,
    { withCredentials: this.signingUrlWithCredentials }
  );
  if (this.signingUrlHeaders) {
    var signingUrlHeaders =
      typeof this.signingUrlHeaders === "function"
        ? this.signingUrlHeaders()
        : this.signingUrlHeaders;
    Object.keys(signingUrlHeaders).forEach(function(key) {
      var val = signingUrlHeaders[key];
      xhr.setRequestHeader(key, val);
    });
  }
  xhr.onreadystatechange = function() {
    if (
      xhr.readyState === 4 &&
      this.signingUrlSuccessResponses.indexOf(xhr.status) >= 0
    ) {
      var result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch (error) {
        this.onError("Invalid response from server", file);
        return false;
      }
      return callback(result);
    } else if (
      xhr.readyState === 4 &&
      this.signingUrlSuccessResponses.indexOf(xhr.status) < 0
    ) {
      console.error(xhr.responseText);
      return this.onError(
        "Could not contact request signing server. Status = " + xhr.status,
        file
      );
    }
  }.bind(this);
  return xhr.send();
};

S3Upload.prototype.uploadToS3 = function(file, signResult) {
  console.log(signResult);
  const headers = new Headers();

  headers.set("Content-Type", file.type);

  if (this.contentDisposition) {
    var disposition = this.contentDisposition;
    if (disposition === "auto") {
      if (file.type.substr(0, 6) === "image/") {
        disposition = "inline";
      } else {
        disposition = "attachment";
      }
    }

    var fileName = this.scrubFilename(file.name);
    headers.set(
      "Content-Disposition",
      disposition + '; filename="' + fileName + '"'
    );
  }

  if (signResult.headers) {
    var signResultHeaders = signResult.headers;
    Object.keys(signResultHeaders).forEach(function(key) {
      headers.set(key, signResultHeaders[key]);
    });
  }

  if (this.uploadRequestHeaders) {
    var uploadRequestHeaders = this.uploadRequestHeaders;
    Object.keys(uploadRequestHeaders).forEach(function(key) {
      headers.set(key, uploadRequestHeaders[key]);
    });
  }
};

S3Upload.prototype.uploadFile = function(file) {
  var uploadToS3Callback = this.uploadToS3.bind(this, file);

  if (this.getSignedUrl) return this.getSignedUrl(file, uploadToS3Callback);
  return this.executeOnSignedUrl(file, uploadToS3Callback);
};

S3Upload.prototype.abortUpload = function() {
  this.httprequest && this.httprequest.abort();
};

export default S3Upload;

export const startFileUpload = ({ file, type, ...opts }) => {
  console.log("Uploading file", file);

  // const path = RNFetchBlob.wrap(
  //   file.uri.startsWith("ph://")
  //     ? convertCameraRollIDToRNFetchBlobId(file.uri, file.type.split("/")[1])
  //     : file.uri.replace("file://", "").replace("content://", "")
  // );

  return RNFetchBlob.polyfill.Blob.build(path, {
    type: `${file.type};`
  }).then(
    blob => {
      file.name = file.fileName;
      console.log("✅ Created blob", blob);

      return new Promise((resolve, reject) => {
        resolve(
          new S3Upload({
            ...opts,
            files: [file],
            signingUrlQueryParams: {
              width: file.width,
              height: file.height,
              type: "Media",
              ...(opts.params || {})
            }
          })
        );
      });
    },
    err => {
      console.error(err);
      return Promise.reject(err);
    }
  );
};
