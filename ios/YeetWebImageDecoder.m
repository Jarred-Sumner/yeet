
#import "YeetWebImageDecoder.h"
#include <WebP/decode.h>
#include "WebPDemux/demux.h"
#import <SDWebImageWebPCoder.h>
#import "YeetAnimatedImage.h"

static void free_data(void *info, const void *data, size_t size)
{
  free((void *) data);
}

@implementation YeetWebImageDecoder

RCT_EXPORT_MODULE()

- (BOOL)canDecodeImageData:(NSData *)imageData
{
  return [[SDImageWebPCoder sharedCoder] canDecodeFromData:imageData];
}

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(UIViewContentMode)resizeMode
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{


  SDImageWebPCoder *coder = [[SDImageWebPCoder sharedCoder] initWithAnimatedImageData:imageData options:@{ SDImageCoderEncodeCompressionQuality: @1}];

  SDAnimatedImage *image = [[SDAnimatedImage alloc] initWithAnimatedCoder:coder scale:scale];

  [image preloadAllFrames];


  completionHandler(nil, [UIImage animatedImageWithImages:image.images duration:image.duration]);

  return ^{};
}
@end
