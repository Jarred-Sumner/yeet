//
//  KVCacheComplete-Swift.h
//  yeet
//
//  Created by Jarred WSumner on 2/3/20.
//  Copyright © 2020 Yeet. All rights reserved.
//

#import <Foundation/Foundation.h>

#ifndef __cplusplus
#pragma once

@class KTVHCDataCacheItem;
@class KTVHCDataRequest;
@class KTVHCDataReader;
@class KTVHCDataLoader;

@interface KTVHTTPCache : NSObject

/**
 *  HTTP Server
 *
 *  This part is used to access the local HTTP server module.
 *  The prefix for API is 'proxy'.
 */
#pragma mark - HTTP Server

/**
 *  Start the proxy service.
 *
 *  @param error : Pointer to receive service error.
 *  @return YES when the proxy service is successfully started, otherwise NO.
 */
+ (BOOL)proxyStart:(NSError **)error;

/**
 *  Stop the proxy service.
 */
+ (void)proxyStop;

/**
 *  Proxy service running status.
 *
 *  @return YES when the proxy service is running, otherwise NO.
 */
+ (BOOL)proxyIsRunning;

/**
 *  Convert the URL to the proxy URL.
 *
 *  @param URL : The URL for HTTP content.
 *  @return If the param is a file URL or the proxy service isn't running, return URL. Otherwise reutrn the proxy URL.
 */
+ (NSURL *)proxyURLWithOriginalURL:(NSURL *)URL;

/**
 *  Data Storage
 *
 *  This part is used to access the data storage module.
 *  The prefix for API is 'cache'.
 */
#pragma mark - Data Storage

/**
 *  Convert the URL to the file URL if the cache is complete.
 *
 *  @param URL : The URL for HTTP content.
 *  @return If the contents of the URL have all been cached, return the complete file URL. Otherwise return nil.
 */
+ (NSURL *)cacheCompleteFileURLWithURL:(NSURL *)URL;

/**
 *  Create the data reader for the request.
 *
 *  @param request : The request of the expected data.
 *  @return The data reader for request.
 */
+ (KTVHCDataReader *)cacheReaderWithRequest:(KTVHCDataRequest *)request;

/**
 *  Create the data loader for the request.
 *
 *  @param request : The request of the expected data.
 *  @return The data loader for request.
 */
+ (KTVHCDataLoader *)cacheLoaderWithRequest:(KTVHCDataRequest *)request;

/**
 *  Set the maximum cache length.
 *  If the current cache length exceeds the maximum length, it will be deleted starting with the oldest cached data.
 *
 *  @param maxCacheLength : The maximum cache length.
 */
+ (void)cacheSetMaxCacheLength:(long long)maxCacheLength;

/**
 *  Get the maximum cache length.
 *
 *  @return Maximum cache length.
 */
+ (long long)cacheMaxCacheLength;

/**
 *  Get the current cached length.
 *
 *  @return Current cached length
 */
+ (long long)cacheTotalCacheLength;

/**
 *  Create the cache item for the URL.
 *
 *  @param URL : The URL for HTTP content.
 *  @return The cache item for URL.
 */
+ (KTVHCDataCacheItem *)cacheCacheItemWithURL:(NSURL *)URL;

/**
 *  Get all cache items.
 *
 *  @return All cache items.
 */
+ (NSArray<KTVHCDataCacheItem *> *)cacheAllCacheItems;

/**
 *  Delete cache for URL.
 *
 *  @param URL : The URL for HTTP content.
 */
+ (void)cacheDeleteCacheWithURL:(NSURL *)URL;

/**
 *  Delete all caches.
 */
+ (void)cacheDeleteAllCaches;

/**
 *  Encode
 *
 *  This part is used to access the encode module.
 *  The prefix for API is 'encode'.
 */
#pragma mark - Encode

/**
 *  Set URL converter.
 *  If the URL contains authentication parameters. It can be removed here to ensure that the indeterminate URL can use the same cache.
 *
 *  @warning High frequency call. Make it simple.
 *
 *  @param URLConverter : The URLConverter.
 */
+ (void)encodeSetURLConverter:(NSURL * (^)(NSURL *URL))URLConverter;

/**
 *  Download
 *
 *  This part is used to access the download module.
 *  The prefix for API is 'download'.
 */
#pragma mark - Download

/**
 *  Set the HTTP timeout interval.
 *
 *  @param timeoutInterval : The HTTP timeout interval.
 */
+ (void)downloadSetTimeoutInterval:(NSTimeInterval)timeoutInterval;

/**
 *  Set HTTP timeout interval.
 *
 *  @return The current HTTP timeout interval.
 */
+ (NSTimeInterval)downloadTimeoutInterval;

/**
 *  Set the whitelist header keys.
 *  The following keys are only supported by default:
 *      User-Agent, Connection, Accept, Accept-Encoding, Accept-Language, Range
 *  If you want to allow other keys, set them here.
 *
 *  @param whitelistHeaderKeys : The keys can be allowed.
 */
+ (void)downloadSetWhitelistHeaderKeys:(NSArray<NSString *> *)whitelistHeaderKeys;

/**
 *  Get the current whitelist header keys.
 */
+ (NSArray<NSString *> *)downloadWhitelistHeaderKeys;

/**
 *  Set the additional headers.
 *  If you want to add extra headers, set them here.
 *
 *  @param additionalHeaders : The headers will be added.
 */
+ (void)downloadSetAdditionalHeaders:(NSDictionary<NSString *, NSString *> *)additionalHeaders;

/**
 *  Get the current additional headers.
 */
+ (NSDictionary<NSString *, NSString *> *)downloadAdditionalHeaders;

/**
 *  Set the acceptable content types.
 *  The following values are only supported by default:
 *      video/x, audio/x, application/mp4, application/octet-stream, binary/octet-stream
 *  If you want to allow other content types, set them here.
 *
 *  @param acceptableContentTypes : The content types can be allowed.
 */
+ (void)downloadSetAcceptableContentTypes:(NSArray<NSString *> *)acceptableContentTypes;

/**
 *  Get the current acceptable content types.
 */
+ (NSArray<NSString *> *)downloadAcceptableContentTypes;

/**
 *  Set the unacceptable content type disposer.
 *  If the receive response's Content-Type not included in acceptContentTypes, this method will be called.
 *  If the return value of block is YES, you can continue to load resources. Otherwise the HTTP task will be rejected.
 *
 *  @param unacceptableContentTypeDisposer : The unacceptable content type disposer.
 */
+ (void)downloadSetUnacceptableContentTypeDisposer:(BOOL(^)(NSURL *URL, NSString *contentType))unacceptableContentTypeDisposer;

/**
 *  Log
 *
 *  This part is used to access the Log module.
 *  The prefix for API is 'log'.
 */
#pragma mark - Log

/**
 *  Add an external log.
 *
 *  @param log : An external log.
 */
+ (void)logAddLog:(NSString *)log;

/**
 *  Set whether to enable the console log.
 *  Default is NO.
 *
 *  @param consoleLogEnable : The value to enable the console log.
 */
+ (void)logSetConsoleLogEnable:(BOOL)consoleLogEnable;

/**
 *  Get the value that enables the console log.
 *
 *  @return The value that enables the console log.
 */
+ (BOOL)logConsoleLogEnable;

/**
 *  Set whether to enable the record log.
 *  Default is NO.
 *
 *  @param recordLogEnable : The value to enable the record log.
 */
+ (void)logSetRecordLogEnable:(BOOL)recordLogEnable;

/**
 *  Get the value that enables the record log.
 *
 *  @return The value that enables the record log.
 */
+ (BOOL)logRecordLogEnable;

/**
 *  Get the path to the log file.
 *
 *  @return The path to the log file.
 */
+ (NSURL *)logRecordLogFileURL;

/**
 *  Delete the log file.
 */
+ (void)logDeleteRecordLogFile;

/**
 *  Get all errors
 *
 *  @return All errors.
 */
+ (NSDictionary<NSURL *, NSError *> *)logErrors;

/**
 *  Get the error for the URL.
 *
 *  @param URL : The URL for HTTP content.
 *  @return The error for the URL.
 */
+ (NSError *)logErrorForURL:(NSURL *)URL;

/**
 *  Delete the error for the URL.
 *
 *  @param URL : The URL for HTTP content.
 */
+ (void)logCleanErrorForURL:(NSURL *)URL;

@end
#endif
