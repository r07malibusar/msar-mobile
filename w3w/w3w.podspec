Pod::Spec.new do |s|
  s.name             = 'w3w'
  s.version          = '4.2.1'
  s.summary          = 'what3words iOS SDK for MSAR'
  s.homepage         = 'https://what3words.com'
  s.author           = { 'what3words' => 'support@what3words.com' }
  s.source           = { :git => 'https://github.com/r07malibusar/msar-mobile.git' }
  s.platform         = :ios, '13.0'
  s.source_files     = 'ios-module/*.{swift,m,h}'
  s.resources        = 'w3w-data.zip'
  s.dependency 'React-Core'
end
