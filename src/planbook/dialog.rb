module Planbook


  module PlanbookDialog # mixin


    require(File.join(PATH, 'bridge.rb'))


    DIALOG_HTML = File.join(PATH, 'html', 'app.html') unless defined?(self::DIALOG_HTML)

    attr_reader :dialog, :bridge

    ### Inspector instance methods

    def open
      @dialog = create_dialog() if @dialog.nil?
      @dialog.show
      nil
    end


    def close
      @dialog.close
      @dialog = nil
      nil
    end


    ### Private methods


    private


    def refresh
      if @dialog && @dialog.visible?
        @dialog.call('refresh')
      end
    end


    def create_dialog
      properties = {
        :dialog_title    => 'Planbook Editor',
        :preferences_key => 'com.jptabe.planbook',
        :scrollable      => false,
        :resizable       => true,
        :width           => 300,
        :height          => 400,
        :left            => 200,
        :top             => 200,
      }
      if defined?(UI::HtmlDialog)
        properties[:style] = UI::HtmlDialog::STYLE_DIALOG
        dialog             = UI::HtmlDialog.new(properties)
      else
        dialog = UI::WebDialog.new(properties)
      end
      dialog.set_file(DIALOG_HTML)

      # Add a Bridge to handle JavaScript-Ruby communication.
      Bridge.decorate(dialog)

      dialog.on('get_translations') {|action_context|
        action_context.resolve(TRANSLATE.to_hash)
      }

      # Callbacks
      # Get settings.
      dialog.on('get_settings') {|action_context|
        action_context.resolve @settings.to_hash
      }
      dialog.on('update_property') {|action_context, key, value|
        @settings[key] = value
      }

      # Transfer the title.
      dialog.on('get_entity') {|action_context|
        action_context.resolve({
          :title => get_title(*@selected_entities),
          :id => (!@selected_entities.empty?) ? @selected_entities.map(&:object_id).join('.') : nil,
          :related => get_related(*@selected_entities)
        })
        # When dialog has completed displaying @selected_entities,
        # update @dialog_entities so that actions on attribute can be
        # applied to the new selection.
        @dialog_entities = @selected_entities
      }

      # Select an entity by id.
      dialog.on('select') {|action_context, identifier|
        # This may raise a RangeError if the object has been garbage-collected.
        select(ObjectSpace._id2ref(identifier))
      }

      if dialog.respond_to?(:set_on_closed) # UI::HtmlDialog
        dialog.set_on_closed {
          self.close
        }
      elsif dialog.respond_to?(:set_on_close) # UI::WebDialog
        dialog.set_on_close {
          self.close
        }
      end
      return dialog
    end

  end


end
