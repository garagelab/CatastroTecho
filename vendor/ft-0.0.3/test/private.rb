ENV["EMAIL"] = "damian.janowski@gmail.com"
ENV["PASSWORD"] = `security 2>&1 find-internet-password -g -s www.google.com -a #{ENV["EMAIL"]}`[/^password: "(.*)"/, 1]
ENV["PRIVATE_TABLE_ID"] = "1340856"
