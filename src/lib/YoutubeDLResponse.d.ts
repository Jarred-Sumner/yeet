export declare module YoutubeDLResponse {
  export interface AutomaticCaptions {}

  export interface DownloaderOptions {
    http_chunk_size: number;
  }

  export interface HttpHeaders {
    Accept: string;
    "Accept-Charset": string;
    "Accept-Encoding": string;
    "Accept-Language": string;
    "User-Agent": string;
  }

  export interface Format {
    abr: number;
    acodec: string;
    asr?: number;
    downloader_options: DownloaderOptions;
    ext: string;
    filesize: number;
    format: string;
    format_id: string;
    format_note: string;
    fps?: number;
    height?: number;
    http_headers: HttpHeaders;
    player_url: string;
    protocol: string;
    tbr: number;
    url: string;
    vcodec: string;
    width?: number;
    container: string;
  }

  export interface DownloaderOptions2 {
    http_chunk_size: number;
  }

  export interface HttpHeaders2 {
    Accept: string;
    "Accept-Charset": string;
    "Accept-Encoding": string;
    "Accept-Language": string;
    "User-Agent": string;
  }

  export interface RequestedFormat {
    acodec: string;
    asr?: number;
    downloader_options: DownloaderOptions2;
    ext: string;
    filesize: number;
    format: string;
    format_id: string;
    format_note: string;
    fps?: number;
    height?: number;
    http_headers: HttpHeaders2;
    player_url: string;
    protocol: string;
    tbr: number;
    url: string;
    vcodec: string;
    width?: number;
    abr?: number;
  }

  export interface Subtitles {}

  export interface Thumbnail {
    id: string;
    url: string;
  }

  export interface Result {
    _filename: string;
    abr: number;
    acodec: string;
    age_limit: number;
    album: string;
    alt_title: string;
    annotations?: any;
    artist: string;
    automatic_captions: AutomaticCaptions;
    average_rating: number;
    categories: string[];
    channel_id: string;
    channel_url: string;
    chapters?: any;
    creator: string;
    description: string;
    dislike_count: number;
    display_id: string;
    duration: number;
    end_time?: any;
    episode_number?: any;
    ext: string;
    extractor: string;
    extractor_key: string;
    format: string;
    format_id: string;
    formats: Format[];
    fps: number;
    fulltitle: string;
    height: number;
    id: string;
    is_live?: any;
    license?: any;
    like_count: number;
    playlist?: any;
    playlist_index?: any;
    release_date?: any;
    release_year?: any;
    requested_formats: RequestedFormat[];
    requested_subtitles?: any;
    resolution?: any;
    season_number?: any;
    series?: any;
    start_time?: any;
    stretched_ratio?: any;
    subtitles: Subtitles;
    tags: string[];
    thumbnail: string;
    thumbnails: Thumbnail[];
    title: string;
    track: string;
    upload_date: string;
    uploader: string;
    uploader_id: string;
    uploader_url: string;
    vbr?: any;
    vcodec: string;
    view_count: number;
    webpage_url: string;
    webpage_url_basename: string;
    width: number;
  }

  export interface RootObject {
    result: Result;
    success: boolean;
    type: 0;
  }
}
