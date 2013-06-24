require "cutest"
require "./lib/ft"
require "./test/private"

setup do
  [FusionTables::Connection.new, ENV["EMAIL"], ENV["PASSWORD"], ENV["PRIVATE_TABLE_ID"]]
end

test "authenticated SELECTs" do |conn, email, password, table_id|
  conn.authenticate(email, password)

  result = conn.query("SELECT Client, Invoice FROM #{table_id}")

  assert_equal result, [
    ["Client", "Invoice"],
    ["Madalyn Streich", "1"],
    ["Mr. Vincenza Bailey", "2"]
  ]

  assert conn.inspect !~ /token/
end

test "INSERT" do |conn, email, password, table_id|
  conn.authenticate(email, password)

  begin
    result = conn.query("INSERT INTO #{table_id} (Client) VALUES ('Foo')")

    assert_equal result[0][0], "rowid"
    assert result[1][0] =~ /^\d+$/
  ensure
    conn.query("DELETE FROM #{table_id} WHERE ROWID = '#{result[1][0]}'") if result
  end
end

test "DELETE" do |conn, email, password, table_id|
  conn.authenticate(email, password)

  result = conn.query("INSERT INTO #{table_id} (Client) VALUES ('Foo')")

  rowid = result[1][0]

  conn.query("DELETE FROM #{table_id} WHERE ROWID = '#{rowid}'")

  result = conn.query("SELECT ROWID FROM #{table_id} WHERE ROWID = '#{rowid}'")

  assert_equal result[1], nil
end
