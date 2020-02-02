//
//  YeetTextEnums.h
//  yeet
//
//  Created by Jarred WSumner on 1/9/20.
//  Copyright © 2020 Facebook. All rights reserved.
//
#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, YeetTextBorder) {
  YeetTextBorderStroke,
  YeetTextBorderEllipse,
  YeetTextBorderSolid,
  YeetTextBorderHidden,
  YeetTextBorderInvert,
  YeetTextBorderHighlight
};

typedef NS_ENUM(NSInteger, YeetTextTemplate) {
  YeetTextTemplateBasic,
  YeetTextTemplateBigWords,
  YeetTextTemplatePost,
  YeetTextTemplateComment,
  YeetTextTemplateComic,
  YeetTextTemplateGary,
  YeetTextTemplateTerminal,
  YeetTextTemplatePickaxe,
};

typedef NS_ENUM(NSInteger, YeetTextFormat) {
  YeetTextFormatPost,
  YeetTextFormatSticker,
  YeetTextFormatComment,
};
