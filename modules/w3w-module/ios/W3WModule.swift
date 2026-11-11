import CoreLocation
import ExpoModulesCore
import Foundation
import w3w

public class W3WModule: Module {
  private var sdk: What3Words?

  public func definition() -> ModuleDefinition {
    Name("W3WModule")

    OnCreate {
      print("[W3WModule] Initializing iOS What3Words offline engine...")
      if let zipUrl = Bundle.main.url(forResource: "w3w-data", withExtension: "zip") {
        print("[W3WModule] Found w3w-data.zip in Bundle.main at: \(zipUrl.path)")
      }
      else {
        print("[W3WModule] WARNING: w3w-data.zip NOT found in Bundle.main!")
      }

      do {
        self.sdk = try What3Words(path: nil)
        print("[W3WModule] SUCCESS: What3Words offline device engine initialized!")
      }
      catch {
        print("[W3WModule] ERROR initializing What3Words: \(error)")
        self.sdk = nil
      }
    }

    AsyncFunction("convertTo3WA") { (lat: Double, lon: Double) -> String? in
      guard let sdk = self.sdk else {
        throw Exception(name: "W3WEngineNil", description: "What3Words offline engine is not initialized (w3w-data.zip missing or license invalid)")
      }

      let coords = CLLocationCoordinate2D(latitude: lat, longitude: lon)
      do {
        if let words = try sdk.convertTo3wa(coordinates: coords, language: W3WSdkLanguage("en")) {
          return words.hasPrefix("///") ? words : "///\(words)"
        }
      }
      catch {
        throw Exception(name: "W3WConversionError", description: error.localizedDescription)
      }
      return nil
    }

    AsyncFunction("convertToCoordinates") { (words: String) -> [String: Double]? in
      guard let sdk = self.sdk else {
        throw Exception(name: "W3WEngineNil", description: "What3Words offline engine is not initialized (w3w-data.zip missing or license invalid)")
      }

      let cleanWords = words.replacingOccurrences(of: "^///", with: "", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
      do {
        if let coords = try sdk.convertToCoordinates(words: cleanWords) {
          return [
            "latitude": coords.latitude,
            "longitude": coords.longitude,
          ]
        }
      }
      catch {
        throw Exception(name: "W3WConversionError", description: error.localizedDescription)
      }
      return nil
    }
  }
}
