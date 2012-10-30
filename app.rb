# encoding: UTF-8

$LOAD_PATH.unshift(File.expand_path("vendor/ft-0.0.3/lib", File.dirname(__FILE__)))
require 'rubygems'
require 'bundler'
require "sinatra/base"
require 'erb'
require 'sinatra/partial'
require "sequel"
require 'fusion_tables'
require "json"

Tilt.register 'md', Tilt::RDiscountTemplate

# Data source

# Test-Connect to data source.
#@db_barrios = Sequel.connect("fusiontables:///")[5355203]
# Get a dataset for testing.
#ds = db.select("NOMBRE DEL BARRIO").all

#table = db[579353]
#FusionTables::Connection::URL = URI.parse("http://www.google.com/fusiontables/DataSource?dsrcid=5355203")
#puts table.select("NOMBRE DEL BARRIO").where("AÑO DE CONFORMACIÓN DEL BARRIO" => 2005).all

DB = Sequel.connect("fusiontables:///")

# New Google API, valid since June 2012!
FusionTables::Connection::URL = URI.parse("https://www.googleapis.com/fusiontables/v1/query")

#FusionTables::Connection::URL = URI.parse("http://www.google.com/fusiontables/DataSource?dsrcid=5355203")
#http://www.google.com/fusiontables/DataSource?dsrcid=5355203

# In Fusion, table IDs are numbers.
TABLES = {
  :barrios => 5355203,
}

Barrios = DB[TABLES[:barrios]]



class NilClass
  def empty?; true; end
end

# Application main class
class Techo < Sinatra::Base
  register Sinatra::Partial

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

    def img name
      "<img src='/images/#{name}' alt='#{name}'/>"
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

  configure do
    #set :public_folder, Proc.new { File.join(root, "static") }
    enable :sessions
  end

  enable :partial_underscores
  set :partial_template_engine, :erb

### Controllers
  get '/' do
    navsidebar = partial :"partials/navsidebar"
    footer = partial :"partials/footer"
    erb :index, :locals => { :navsidebar => navsidebar, :footer => footer }
  end

  get "/content/:page" do |page|
    erb :"content/#{page}"
  end

  get "/barrio/:id" do |id|
    @barrio = Barrios.where(:id => id).first
    erb(:"barrio")
  end

  # Start the server, if ruby file executed directly.
  run! if app_file == $0
end