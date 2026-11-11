Pod::Spec.new do |s|
  s.name           = 'w3w-module'
  s.version        = '1.0.0'
  s.summary        = 'Expo Module for What3Words Offline Engine'
  s.description    = 'Expo Module bridging what3words offline engine to React Native'
  s.author         = 'MSAR'
  s.homepage       = 'https://github.com/r07malibusar/msar-mobile'
  s.platform       = :ios, '15.1'
  s.source         = { :path => '.' }
  s.source_files   = '*.{swift,m}'

  s.dependency 'ExpoModulesCore'
  s.vendored_frameworks = 'Frameworks/w3w.xcframework'
  s.resources      = 'Resources/w3w-data.zip'
end
