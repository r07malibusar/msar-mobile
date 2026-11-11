import CoreLocation
import Foundation
import React
import w3w

@objc(W3WModule)
class W3WModule: NSObject, RCTBridgeModule {
  private var sdk: What3Words?

  @objc
  static func moduleName() -> String! {
    return "W3WModule"
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override init() {
    super.init()
    print("[W3WModule] Native init called...")

    if let zipUrl = Bundle.main.url(forResource: "w3w-data", withExtension: "zip") {
      print("[W3WModule] SUCCESS: Found w3w-data.zip in Bundle.main at: \(zipUrl.path)")
    }
    else {
      print("[W3WModule] ERROR: w3w-data.zip NOT found in Bundle.main!")
    }

    do {
      self.sdk = try What3Words()
      print("[W3WModule] SUCCESS: What3Words native SDK initialized!")
    }
    catch {
      print("[W3WModule] ERROR: What3Words init failed: \(error)")
      self.sdk = nil
    }
  }

  @objc(convertTo3WA:lon:resolver:rejecter:)
  func convertTo3WA(_ lat: Double, lon: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    print("[W3WModule] convertTo3WA called with lat: \(lat), lon: \(lon)")
    guard let sdk = self.sdk else {
      print("[W3WModule] convertTo3WA failed: sdk engine is nil")
      resolve(nil)
      return
    }

    let coords = CLLocationCoordinate2D(latitude: lat, longitude: lon)
    do {
      if let square = try sdk.convertTo3wa(coordinates: coords, language: W3WSdkLanguage("en")) {
        print("[W3WModule] convertTo3WA SUCCESS: ///\(square.words)")
        resolve("///\(square.words)")
      }
      else {
        print("[W3WModule] convertTo3WA returned nil square")
        resolve(nil)
      }
    }
    catch {
      print("[W3WModule] convertTo3WA EXCEPTION: \(error)")
      resolve(nil)
    }
  }

  @objc(convertToCoordinates:resolver:rejecter:)
  func convertToCoordinates(_ words: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    print("[W3WModule] convertToCoordinates called with words: \(words)")
    guard let sdk = self.sdk else {
      print("[W3WModule] convertToCoordinates failed: sdk engine is nil")
      resolve(nil)
      return
    }

    let cleanWords = words.replacingOccurrences(of: "^///", with: "", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
    do {
      if let coords = try sdk.convertToCoordinates(words: cleanWords) {
        print("[W3WModule] convertToCoordinates SUCCESS: \(coords.latitude), \(coords.longitude)")
        resolve([
          "latitude": coords.latitude,
          "longitude": coords.longitude,
        ])
      }
      else {
        print("[W3WModule] convertToCoordinates returned nil coords")
        resolve(nil)
      }
    }
    catch {
      print("[W3WModule] convertToCoordinates EXCEPTION: \(error)")
      resolve(nil)
    }
  }
}
