require 'sketchup.rb'
require 'extensions.rb'

  module Planbook

    unless file_loaded?(__FILE__)
      ex = SketchupExtension.new('Planbook', 'planbook/core')
      ex.description = 'Jonathan`s SKP extension to simplify making timber frame planbooks'
      ex.version     = '1.0.0'
      ex.copyright   = '© Jonathan Tabeling'
      ex.creator     = 'Jonathan Tabeling'
      Sketchup.register_extension(ex, true)
      file_loaded(__FILE__)
    end

  end # module Planbook
