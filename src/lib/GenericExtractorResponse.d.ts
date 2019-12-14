export declare module GenericeExtractorResponse {
  export interface HttpHeaders {
    Accept: string;
    "Accept-Charset": string;
    "Accept-Encoding": string;
    "Accept-Language": string;
    "User-Agent": string;
  }

  export interface Thumbnail {
    id: string;
    url: string;
  }

  export interface Result {
    _filename: string;
    age_limit: number;
    comment_count: number;
    direct: boolean;
    dislike_count: number;
    display_id: string;
    ext: string;
    extractor: string;
    extractor_key: "Generic";
    format: string;
    format_id: string;
    fulltitle: string;
    http_headers: HttpHeaders;
    id: string;
    like_count: number;
    playlist?: any;
    playlist_index?: any;
    protocol: string;
    requested_subtitles?: any;
    thumbnail?: string;
    thumbnails?: Thumbnail[];
    timestamp: number;
    title: string;
    upload_date: string;
    uploader: string;
    url: string;
    webpage_url?: string;
    webpage_url_basename: string;
  }

  export interface RootObject {
    result: Result;
    success: boolean;
    type: number;
  }
}
