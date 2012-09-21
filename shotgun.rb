require "compass"

spawn("compass watch -c config/sass.rb")

at_exit do
  Process.waitall
end