task :default => :test

desc "Run all tests"
task :test do
  require "cutest"

  files = Dir["./test/*.rb"]

  if !files.include?("./test/private.rb")
    $stderr.puts("Couldn't find a test/private.rb file, so skipping tests that require authentication.\nIf you want to run them, take a look at test/private.example.rb")
    files.delete("./test/authenticated.rb")
  end

  Cutest.run(files)
end
