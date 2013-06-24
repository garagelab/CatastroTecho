require "cutest"
require "shellwords"
require "open3"

ROOT = File.expand_path(File.join(File.dirname(__FILE__), ".."))

def root(*args)
  File.join(ROOT, *args)
end

def ft(*args)
  sh("ruby #{root "bin/ft"} #{Shellwords.join args}")
end

def sh(cmd)
  Open3.capture3(cmd)
end

test "query" do |conn|
  out, err, _ = ft("query", "SELECT 'Name', 'Order' FROM 1310767")

  assert err.empty?

  lines = out.split("\n")

  assert_equal lines[0], "Name,Order"
  assert_equal lines[1], "rake,1"
  assert_equal lines[2], "rack,2"
end

test "query -f table" do |conn|
  out, err, _ = ft("query", "-f", "table", "SELECT 'Name', 'Order' FROM 1310767")

  assert err.empty?

  lines = out.split("\n")

  assert_equal lines[1], "| Name | Order |"
  assert_equal lines[3], "| rake | 1     |"
  assert_equal lines[4], "| rack | 2     |"
end

test "errors" do |conn|
  out, err, status = ft("query", "SELECT foo FROM 1310767")

  assert out.empty?
  assert_equal err, "Column `foo' does not exist. SQL was: SELECT foo FROM 1310767\n"
  assert_equal status.exitstatus, 1
end
