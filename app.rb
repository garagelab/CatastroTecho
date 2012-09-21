# encoding: UTF-8

$LOAD_PATH.unshift(File.expand_path("vendor/ft-0.0.3/lib", File.dirname(__FILE__)))

require "sinatra/base"
require "sequel"
require "json"

Tilt.register 'md', Tilt::RDiscountTemplate

DB = Sequel.connect("fusiontables:///")

FusionTables::Connection::URL = URI.parse("http://tables.googlelabs.com/api/query")

TABLES = {
  :barrios       => 2338632,
}

Barrios = DB[TABLES[:barrios]]

class NilClass
  def empty?; true; end
end

class Techo < Sinatra::Base
  helpers do
    def root(path)
      File.expand_path(path, File.dirname(__FILE__))
    end

    include Rack::Utils
    alias_method :h, :escape_html

    def join_cols(row, name)
      row.keys.grep(/^#{name}_\d+$/).map do |key|
        row[key] unless row[key].empty?
      end.compact.join("<br>\n")
    end

    def yesno(value)
      if value == "1"
        "Sí"
      else
        "No"
      end
    end
  end

  set :app_file, __FILE__

  WWW = /^(https?:\/\/)www\./
  COM = /^(https?:\/\/)(.+?)\.com\.ar/

  before do
    if request.url =~ WWW
      redirect(request.url.sub(WWW, '\1'), 301)
    end

    if request.url =~ COM
      redirect(request.url.sub(COM, '\1\2.org.ar'), 301)
    end
  end

  get "/" do
    erb(:"index")
  end

  get "/contenido/:page" do |page|
    erb(:"contenido/#{page}")
  end

  get "/barrio/:id" do |id|
    @barrio = Barrios.where(:id => id).first
    erb(:"barrio")
  end
end
