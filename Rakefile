# encoding: UTF-8

desc "Deploy a Heroku"
task :deploy do
  sh("git status --porcelain | grep -qv '^??'") do |dirty, _|
    fail "Working directory is dirty." if dirty
  end

  branch = `git symbolic-ref -q HEAD`[11..-2]

  origin = "heroku-#{branch}"

  begin
    sh "git branch -D deploy || true"
    sh "git checkout -b deploy"
    sh "find . -name '*.scss' | xargs touch -m"
    sh "compass compile . -c config/sass.rb --relative-assets -q -e production"
    sh "git add -f public/css"
    sh "git commit -m 'Deploy.'"
    sh "git push -f #{origin} deploy:master"
  ensure
    sh "git checkout #{branch}"
    sh "find . -name '*.scss' | xargs touch -m"
  end
end
