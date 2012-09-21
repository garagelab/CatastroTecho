require "cutest"
require "./lib/ft"

setup do
  FusionTables::Connection.new
end

test "SELECT from public tables" do |conn|
  result = conn.query("SELECT Name FROM 1310767")

  assert_equal result[0][0], "Name"
end

test "raises errors" do |conn|
  assert_raise FusionTables::Error do
    conn.query("SELECT foo FROM 1310767")
  end
end

test "raises on authentication errors" do |conn|
  assert_raise FusionTables::Error do
    conn.query("INSERT INTO 1310767 (Name) VALUES ('Foo')")
  end
end

test "quoting" do |conn|
  assert_equal FusionTables::Connection.quote("C'mon"), %q{'C\'mon'}
end
