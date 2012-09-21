Gem::Specification.new do |s|
  s.name              = "ft"
  s.version           = "0.0.3"
  s.summary           = "Low-level interface to Google's Fusion Tables + CLI tool"
  s.authors           = ["Damian Janowski"]
  s.email             = ["djanowski@dimaion.com"]
  s.homepage          = "http://github.com/djanowski/ft"

  s.executables.push("ft")

  s.add_dependency("clap")
  s.add_dependency("terminal-table")
  s.add_dependency("net-http-persistent")

  s.files = Dir[
    "*.gemspec",
    "CHANGELOG.*",
    "LICENSE",
    "README*",
    "Rakefile",
    "bin/*",
    "lib/**/*",
    "test/**/*",
  ]
end
