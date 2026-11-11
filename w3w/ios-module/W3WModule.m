#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(W3WModule, NSObject)

RCT_EXTERN_METHOD(convertTo3WA:(double)lat lon:(double)lon resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(convertToCoordinates:(NSString *)words resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
