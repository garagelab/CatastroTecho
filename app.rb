#encoding: UTF-8

$LOAD_PATH.unshift(File.expand_path("vendor/ft-0.0.3/lib", File.dirname(__FILE__)))
require 'rubygems'
require 'bundler'
require 'sinatra/base'
require 'erb'
require 'sinatra/partial'
require 'fusion_tables'
require 'json'
require 'pony'
#require 'sequel'

Tilt.register 'md', Tilt::RDiscountTemplate

class NilClass
	def empty?; true; end
end

# Application main class
class Techo < Sinatra::Base
  	register Sinatra::Partial

	#################################################################
	### helpers functions
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
	### init
	#################################################################  	
	before do
    	# Application version
    	@version = "21/10/2013"

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
#  	userinfo = "Por favor, ingrese para tener acceso a la información.".encode(Encoding::ISO_8859_1)
#  	use Rack::Auth::Basic, userinfo do |username, password|
#    		username == 'catastro' and password == 'utpmp'
#  	end

	#################################################################
	### Controller/Handler
	#################################################################  	
  	get '/' do
    	footer = partial :"partials/footer"
    	erb :index, :locals => { :footer => footer }
  	end

  	get '/content/:page' do |page|
    	erb :"content/#{page}"
  	end

 	post '/content/contact' do 
 		# SendGrid add-on in heroku for contact mails created at 15-oct-2013.
 		if params[:organization] then
 			body = "Nombre: " + params[:first_name] + " " + 
 					params[:last_name] + "\n\n" + "Organización: " + 
 					params[:organization] + "\n\n" + "Email: " + 
 					params[:email] + "\n\n" "Mensaje: " + "\n\n" + params[:message] 
 		else
 			body = "Nombre: " + params[:first_name] + " " + params[:last_name] + 
 			"\n\n" + "Email: " + params[:email] + 
 			"\n\n" "Mensaje: " + "\n\n" + params[:message]
 		end
 		
		Pony.mail(
			:from => params[:first_name] + " " + params[:last_name] + 
					" <" + params[:email] + ">",
		  	:to => 'cis.argentina@techo.org',
		  	:subject => "Relevamiento Argentina: Nuevo mensaje de " + 
		  				params[:first_name] + " " + params[:last_name],
		  	:body => body, 
		  	:port => '587',
		  	:via => :smtp,
		  	:via_options => { 
				:address => 'smtp.sendgrid.net', 
				:port => '587', 
    			:domain => 'heroku.com',
    			:user_name => ENV['SENDGRID_USERNAME'],
    			:password => ENV['SENDGRID_PASSWORD'],
    			:authentication => :plain,
    			:enable_starttls_auto => true
		  	}
		)
    	redirect '/content/success' 
	end
	
	get '/content/success' do
	
	end
  	
  	# Start the server, if ruby file executed directly.
  	run! if app_file == $0
end

