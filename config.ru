#
# config.ru
# Which allows using any Rack handler.
#
require File.expand_path("./app", File.dirname(__FILE__))
run Techo
