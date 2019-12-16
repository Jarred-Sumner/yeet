//
//  FindContours.m
//  yeet
//
//  Created by Jarred WSumner on 12/14/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "FindContours.h"
#include <opencv2/core/types.hpp>
#import "UIImage+OpenCVConversion.h"
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#import <opencv2/imgcodecs/ios.h>

using namespace cv;
using namespace std;

//
//im_gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
//im_gray = cv2.bilateralFilter(im_gray, 11, 17, 17)
//ret, thresh = cv2.threshold(im_gray, 240, 240, 0)
//im2, contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

@implementation FindContours

// results:
// - (0.0, 0.0, 778.0, 206.0)]
// - () [ele6bpnedn441.png]

+ (NSArray*)findContoursInImage:(UIImage*)image
{
  cv::Mat original = [UIImage toCvMat:image];
    CGRect _cropRect = CGRectMake(0, 0, image.size.width, image.size.height);
  CGSize targetSize = image.size;



    std::vector<std::vector<cv::Point>>squares;
    std::vector<cv::Point> largest_square;

    find_squares(original, squares);
    find_largest_square(squares, largest_square);



     original.release();



  NSMutableArray *rects = [[NSMutableArray alloc] init];
  for (int i = 0; i < squares.size(); i++) {
    [rects addObject:[NSValue valueWithCGRect:[self rectFromSquare:squares[i]]]];
  }

  return rects;
}

+ (CGRect)rectFromSquare:(std::vector<cv::Point>)largest_square {
  CGPoint origin = CGPointZero;
   CGSize size = CGSizeZero;

     if (largest_square.size() == 4)
      {

          // Manually sorting points, needs major improvement. Sorry.

          NSMutableArray *points = [NSMutableArray array];
          NSMutableDictionary *sortedPoints = [NSMutableDictionary dictionary];

          for (int i = 0; i < 4; i++)
          {
              NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:[NSValue valueWithCGPoint:CGPointMake(largest_square[i].x, largest_square[i].y)], @"point" , [NSNumber numberWithInt:(largest_square[i].x + largest_square[i].y)], @"value", nil];
              [points addObject:dict];
          }

          int min = [[points valueForKeyPath:@"@min.value"] intValue];
          int max = [[points valueForKeyPath:@"@max.value"] intValue];

          int minIndex;
          int maxIndex;

          int missingIndexOne;
          int missingIndexTwo;

          for (int i = 0; i < 4; i++)
          {
              NSDictionary *dict = [points objectAtIndex:i];

              if ([[dict objectForKey:@"value"] intValue] == min)
              {
                  [sortedPoints setObject:[dict objectForKey:@"point"] forKey:@"0"];
                  minIndex = i;
                  continue;
              }

              if ([[dict objectForKey:@"value"] intValue] == max)
              {
                  [sortedPoints setObject:[dict objectForKey:@"point"] forKey:@"2"];
                  maxIndex = i;
                  continue;
              }

              NSLog(@"MSSSING %i", i);

              missingIndexOne = i;
          }

          for (int i = 0; i < 4; i++)
          {
              if (missingIndexOne != i && minIndex != i && maxIndex != i)
              {
                  missingIndexTwo = i;
              }
          }


          if (largest_square[missingIndexOne].x < largest_square[missingIndexTwo].x)
          {
              //2nd Point Found
              [sortedPoints setObject:[[points objectAtIndex:missingIndexOne] objectForKey:@"point"] forKey:@"3"];
              [sortedPoints setObject:[[points objectAtIndex:missingIndexTwo] objectForKey:@"point"] forKey:@"1"];
          }
          else
          {
              //4rd Point Found
              [sortedPoints setObject:[[points objectAtIndex:missingIndexOne] objectForKey:@"point"] forKey:@"1"];
              [sortedPoints setObject:[[points objectAtIndex:missingIndexTwo] objectForKey:@"point"] forKey:@"3"];
          }


          origin = [[sortedPoints objectForKey:@"0"] CGPointValue];

        CGPoint topRight = [[sortedPoints objectForKey:@"1"] CGPointValue];
        CGPoint bottomRight = [[sortedPoints objectForKey:@"2"] CGPointValue];
        CGPoint bottomLeft = [[sortedPoints objectForKey:@"3"] CGPointValue];
        size.width = bottomRight.x - bottomLeft.x;
        size.height = bottomRight.y - topRight.y;
      }

  return CGRectMake(origin.x, origin.y, size.width, size.height);
}

// http://stackoverflow.com/questions/8667818/opencv-c-obj-c-detecting-a-sheet-of-paper-square-detection
void find_squares(cv::Mat& image, vector<vector<cv::Point>>&squares) {

    // blur will enhance edge detection
    cv::Mat blurred(image);
    medianBlur(image, blurred, 5);

    cv::Mat gray0(blurred.size(), CV_8U), gray;
    vector<vector<cv::Point> > contours;

    // find squares in every color plane of the image
    for (int c = 0; c < 3; c++)
    {
        int ch[] = {c, 0};
        mixChannels(&blurred, 1, &gray0, 1, ch, 1);

        // try several threshold levels
        const int threshold_level = 10;
        for (int l = 0; l < threshold_level; l++)
        {

                gray = gray0 >= (l+1) * 255 / threshold_level;


            // Find contours and store them in a list
          findContours(gray, contours, RETR_LIST, CHAIN_APPROX_SIMPLE);

            // Test contours
            vector<cv::Point> approx;
            for (size_t i = 0; i < contours.size(); i++)
            {
                // approximate contour with accuracy proportional
                // to the contour perimeter
                approxPolyDP(cv::Mat(contours[i]), approx, arcLength(cv::Mat(contours[i]), true)*0.02, true);

                // Note: absolute value of an area is used because
                // area may be positive or negative - in accordance with the
                // contour orientation
                if (approx.size() == 4 &&
                    fabs(contourArea(cv::Mat(approx))) > 1000 &&
                    isContourConvex(cv::Mat(approx)))
                {

                    double maxCosine = 0;

                    for (int j = 2; j < 5; j++)
                    {
                        double cosine = fabs(angle(approx[j%4], approx[j-2], approx[j-1]));
                        maxCosine = MAX(maxCosine, cosine);
                    }

                  if (maxCosine < 0.3) {
                    squares.push_back(approx);
                  }

                }
            }
        }
    }
}


void find_largest_square(const vector<vector<cv::Point> >& squares, vector<cv::Point>& biggest_square)
{
    if (!squares.size())
    {
        // no squares detected
        return;
    }

    int max_width = 0;
    int max_height = 0;
    int max_square_idx = 0;

    for (size_t i = 0; i < squares.size(); i++)
    {
        // Convert a set of 4 unordered Points into a meaningful cv::Rect structure.
        cv::Rect rectangle = boundingRect(cv::Mat(squares[i]));

        //        cout << "find_largest_square: #" << i << " rectangle x:" << rectangle.x << " y:" << rectangle.y << " " << rectangle.width << "x" << rectangle.height << endl;

        // Store the index position of the biggest square found
        if ((rectangle.width >= max_width) && (rectangle.height >= max_height))
        {
            max_width = rectangle.width;
            max_height = rectangle.height;
            max_square_idx = i;
        }
    }

    biggest_square = squares[max_square_idx];
}


double angle( cv::Point pt1, cv::Point pt2, cv::Point pt0 ) {
    double dx1 = pt1.x - pt0.x;
    double dy1 = pt1.y - pt0.y;
    double dx2 = pt2.x - pt0.x;
    double dy2 = pt2.y - pt0.y;
    return (dx1*dx2 + dy1*dy2)/sqrt((dx1*dx1 + dy1*dy1)*(dx2*dx2 + dy2*dy2) + 1e-10);
}

cv::Mat debugSquares( std::vector<std::vector<cv::Point> > squares, cv::Mat image ){

    NSLog(@"DEBUG!/?!");
    for ( unsigned int i = 0; i< squares.size(); i++ ) {
        // draw contour

        NSLog(@"LOOP!");

        cv::drawContours(image, squares, i, cv::Scalar(255,0,0), 1, 8, std::vector<cv::Vec4i>(), 0, cv::Point());

        // draw bounding rect
        cv::Rect rect = boundingRect(cv::Mat(squares[i]));
        cv::rectangle(image, rect.tl(), rect.br(), cv::Scalar(0,255,0), 2, 8, 0);

        // draw rotated rect
        cv::RotatedRect minRect = minAreaRect(cv::Mat(squares[i]));
        cv::Point2f rect_points[4];
        minRect.points( rect_points );
        for ( int j = 0; j < 4; j++ ) {
            cv::line( image, rect_points[j], rect_points[(j+1)%4], cv::Scalar(0,0,255), 1, 8 ); // blue
        }
    }

    return image;
}


@end

