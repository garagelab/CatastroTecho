require "csv"
require "net/http/persistent"
require "net/https"

unless "".respond_to?(:force_encoding)
  class String
    def force_encoding(*args)
      self
    end
  end
end

class FusionTables
  Error = Class.new(RuntimeError)

  class Connection
    URL = URI.parse("https://www.googleapis.com/fusiontables/v1/query")
    API_URL = "tu api"

    def http
      @http ||= Net::HTTP::Persistent.new("fusiontables").tap do |http|
        http.headers["Content-Type"] = "application/x-www-form-urlencoded"
      end
    end

    # Queries the Fusion Tables API with the given SQL and returns an
    # array of arrays for rows and columns.
    def query(sql)
      res = process_sql(sql.gsub('(', '').gsub(')', ''))

      case res
      when Net::HTTPOK
        CSV.parse(res.body.force_encoding("UTF-8"))
      when Net::HTTPFound
        raise Error.new("Authentication required. See #{self.class}#authenticate")
      when Net::HTTPBadRequest
        message = CGI.unescapeHTML(res.body[%r[<title>(.*)</title>]i, 1])
        raise Error.new("#{message}. SQL was: #{sql}")
      else
        raise "Got #{res.class}: #{res.body}"
      end
    end

    # Authenticates against Google using your email and password.
    #
    # Note that this method uses the ClientLogin mechanism and it
    # only stores the resulting token as an instance variable.  Your
    # credentials are discarded after the authentication process.
    def authenticate(email, password)
      uri = URI.parse("https://www.google.com/accounts/ClientLogin")

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER

      request = Net::HTTP::Post.new(uri.request_uri)

      request.set_form_data({
        "accountType" => "GOOGLE",
        "Email" => email,
        "Passwd" => password,
        "service" => "fusiontables"
      })

      response = http.request(request)

      case response
      when Net::HTTPOK
        @token = response.body[/^Auth=(.*)$/, 1]
        return true
      else
        @token = nil
        return false
      end
    end

    # Prevents any authorization tokens from being exposed in error logs
    # and the like.
    def inspect
      "#<#{self.class}>"
    end

    # Safely quotes a value.
    def self.quote(value)
      "'#{value.to_s.gsub("'", "\\\\'")}'"
    end

  protected

    # Takes SQL and queries the Fusion Tables API.
    def process_sql(sql)
      url = URL.dup
      api_key = API_URL

      if @token
        http.headers["Authorization"] = "GoogleLogin auth=#{@token}"
      end

      if sql =~ /^select/i
        url.query = "sql=#{URI.escape(sql)}&key=#{api_key}&alt=csv"
        res = http.request(url)
      else
        req = Net::HTTP::Post.new(url.path)
        req.set_form_data({:sql => sql, :key => api_key, :alt => csv})
        res = http.request(url, req)
      end

      res
    end
  end
end
