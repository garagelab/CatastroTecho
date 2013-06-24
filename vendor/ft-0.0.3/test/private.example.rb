# This example works with OS X's keychain, but you can set the variables
# as you please.
#

# ENV["EMAIL"] = "<your google account email>" # If not already in your shell.
ENV["PASSWORD"] = `security 2>&1 find-internet-password -g -s www.google.com -a #{ENV["EMAIL"]}`[/^password: "(.*)"/, 1]

ENV["PRIVATE_TABLE_ID"] = "<your private table id>"
