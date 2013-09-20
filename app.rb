#encoding: UTF-8

$LOAD_PATH.unshift(File.expand_path("vendor/ft-0.0.3/lib", File.dirname(__FILE__)))
require 'rubygems'
require 'bundler'
require 'sinatra/base'
require 'erb'
require 'sinatra/partial'
require 'fusion_tables'
require 'json'
#require 'sequel'

Tilt.register 'md', Tilt::RDiscountTemplate

### Database
#DB = Sequel.connect("fusiontables:///")

API_KEY = 'AIzaSyCQ3Kiec1Vz_flwDFJxqahORuIES0WVxmw'

TABLES = {
	:buenos_aires		=> '1_fEVSZmIaCJzDQoOgTY7pIcjBLng1MFOoeeTtYY'.to_sym
}

#FusionTables::Connection::URL = URI.parse("https://www.googleapis.com/fusiontables/v1/query")
#FusionTables::Connection::API_URL = API_KEY


class NilClass
	def empty?; true; end
end

# Application main class
class Techo < Sinatra::Base
  	register Sinatra::Partial

	#################################################################
	### 
	#################################################################  	
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

    	def number_with_delimeter(value)
    		#
      		# Add thousands separators to numbers.
      		#
      		value.to_s.gsub(/(\d)(?=(\d\d\d)+(?!\d))/, "\\1.")
    	end
	end # helpers

	set :app_file, __FILE__

  	WWW = /^(https?:\/\/)www\./
  	COM = /^(https?:\/\/)(.+?)\.com\.ar/

	#################################################################
	### 
	#################################################################  	
	before do
    	# Application version
    	@version = "12/06/2013"

    	# Connect to service of fusion tables
		@ft = GData::Client::FusionTables.new

    	# In Fusion, table IDs are numbers.
		TABLES = {
			:buenos_aires		=> '1_fEVSZmIaCJzDQoOgTY7pIcjBLng1MFOoeeTtYY'
		}

    	# Prepare queries.
    	@qry_total_barrios = "SELECT 'BARRIO', 'PARTIDO', 'LOCALIDAD' FROM #{TABLES[:buenos_aires]} GROUP BY 'BARRIO', 'PARTIDO', 'LOCALIDAD';"
		@qry_total_families = "SELECT sum('NRO DE FLIAS') as families, count('BARRIO') FROM #{TABLES[:buenos_aires]};"

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

	## HTTP authentication
	# We protect all requests (for all directories, etc.) in the application.
 	userinfo = "Por favor, ingrese para tener acceso a la información.".encode(Encoding::ISO_8859_1)
 	use Rack::Auth::Basic, userinfo do |username, password|
   		username == 'catastro' and password == 'utpmp'
 	end

	#################################################################
	### Controller
	#################################################################  	
  	get '/' do
    	navsidebar = partial :"partials/navsidebar"
    	footer = partial :"partials/footer"
    	erb :index, :locals => { :navsidebar => navsidebar, :footer => footer }
  	end

  	get '/content/:page' do |page|
    	erb :"content/#{page}"
  	end
	
  	# Start the server, if ruby file executed directly.
  	run! if app_file == $0
end

