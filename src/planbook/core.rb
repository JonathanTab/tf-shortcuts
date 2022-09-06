require 'sketchup.rb'

  module Planbook

    # Constants
    self::PATH = File.expand_path('..', __FILE__) unless defined?(self::PATH)


    # Requirements
    %w(
      planbook.rb
      dialog.rb
      observers.rb
      settings.rb
      mode.rb
      ui.rb
    ).each{ |file| require(File.join(PATH, file)) }


    # API

    # Opens the dialog.
    def self.open
      if @@instance.nil?
        @@instance = self::Planbook.new(@@settings)
      end
      @@instance.open
    end


    # Closes the dialog.
    def self.close
      @@instance.close unless @@instance.nil?
      @@instance = nil
    end


    # Selects entities in the Planbook dialog.
    # @param [Array<Sketchup::Drawingelement>] entities
    def self.select(*entities)
      @@instance.select(*entities) unless @@instance.nil?
    end


    ### Plugin

    def self.initialize_plugin
      # Load settings
      @@settings ||= Settings.new('Planbook').load({
        :recent_paths => []
      })
      # Reference to singleton instance
      @@instance ||= nil
    end
    private_class_method :initialize_plugin


    ### Initialization

    unless file_loaded?(__FILE__)
      initialize_plugin
      initialize_ui
      file_loaded(__FILE__)
    end
  end # module Planbook
