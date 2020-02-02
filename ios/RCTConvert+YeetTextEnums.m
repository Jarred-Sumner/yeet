//
//  YeetEnums.m
//  yeet
//
//  Created by Jarred WSumner on 1/30/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "YeetTextEnums.h"
#import <React/RCTConvert.h>


@implementation RCTConvert (YeetTextEnums)

RCT_ENUM_CONVERTER(YeetTextBorder, (@{
@"stroke": @(YeetTextBorderStroke),
@"ellipse": @(YeetTextBorderEllipse),
@"solid": @(YeetTextBorderSolid),
@"hidden": @(YeetTextBorderHidden),
@"invert": @(YeetTextBorderInvert),
@"highlight": @(YeetTextBorderHighlight),
}), YeetTextBorderHidden, integerValue);

RCT_ENUM_CONVERTER(YeetTextTemplate, (@{
@"basic": @(YeetTextTemplateBasic),
@"bigWords": @(YeetTextTemplateBigWords),
@"post": @(YeetTextTemplatePost),
@"comment": @(YeetTextTemplateComment),
@"comic": @(YeetTextTemplateComic),
@"gary": @(YeetTextTemplateGary),
@"terminal": @(YeetTextTemplateTerminal),
@"pickaxe": @(YeetTextTemplatePickaxe),
}), YeetTextTemplatePost, integerValue);

RCT_ENUM_CONVERTER(YeetTextFormat, (@{
@"post": @(YeetTextFormatPost),
@"sticker": @(YeetTextFormatSticker),
@"comment": @(YeetTextFormatComment),
}), YeetTextFormatPost, integerValue);

@end
